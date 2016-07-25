'use strict'

const { EventEmitter } = require('events')
const { resolve, join } = require('path')
const { app, dialog, shell, ipcMain: ipc } = require('electron')
const { verbose } = require('../common/log')
const { open } = require('./window')
const { Database } = require('../common/db')
const { into, compose, remove, take } = require('transducers.js')

const AppMenu = require('./menu')
const Storage = require('./storage')

const pkg = require('../../package')

const { defineProperty: prop } = Object
const { OPEN, OPENED, CREATED } = require('../constants/project')


class Tropy extends EventEmitter {

  static get defaults() {
    return {
      frameless: (process.platform === 'darwin'),
      locale: app.getLocale(),
      recent: []
    }
  }

  constructor() { // eslint-disable-line constructor-super
    if (Tropy.instance) return Tropy.instance

    super()
    Tropy.instance = this

    this.menu = new AppMenu(this)

    prop(this, 'store', { value: new Storage() })

    prop(this, 'projects', { value: new Map() })

    prop(this, 'home', {
      value: resolve(__dirname, '..', '..')
    })
  }

  open(file = this.state.recent[0]) {
    if (!file) return this.create()
    if (file) file = resolve(file)

    verbose(`opening ${file}...`)

    if (this.win) {
      if (file) this.win.webContents.send(OPEN, file)
      return this.win.show(), this
    }

    this.win = open('project', { file, ...this.hash }, {
      width: 1280,
      height: 720,
      frame: !this.hash.frameless
    })
      .once('closed', () => { this.win = undefined })


    return this
  }

  opened({ file }) {
    this.state.recent = into([file],
        compose(remove(f => f === file), take(9)), this.state.recent)

    switch (process.platform) {
      case 'darwin':
      case 'win32':
        app.addRecentDocument(file)
        break
    }

    // Note: there may be Electron issues when reloading
    // the main menu. But since we cannot remove items
    // dynamically (#527) this is our only option.
    this.menu.load()
  }

  async create() {
    const file = join(app.getPath('userData'), 'dev.tpy')
    await Database.create(file, { name: 'My Research' })

    this.open(file)
  }

  restore() {
    return this.store
      .load('state.json')
      .then(state => ({ ...Tropy.defaults, ...state }))
      .catch({ code: 'ENOENT' }, () => Tropy.defaults)

      .then(state => (this.state = state, this))

      .tap(() => this.menu.load())
      .tap(() => this.emit('app:restored'))
      .tap(() => verbose('app state restored'))
  }

  persist() {
    return this.store.save.sync('state.json', this.state), this
  }

  listen() {
    this
      .on('app:new-archive', () => this.create())

      .on('app:toggle-menu-bar', win => {
        if (win.isMenuBarAutoHide()) {
          win.setAutoHideMenuBar(false)
        } else {
          win.setAutoHideMenuBar(true)
          win.setMenuBarVisibility(false)
        }
      })
      .on('app:clear-recent-projects', () => {
        verbose('clearing recent projects...')
        this.state.recent = []

        // Note: there may be Electron issues when reloading
        // the main menu. But since we cannot remove items
        // dynamically (#527) this is our only option.
        this.menu.load()
      })

      .on('app:open-license', () => {
        shell.openExternal('https://github.com/tropy/tropy/blob/master/LICENSE')
      })

      .on('app:search-issues', () => {
        shell.openExternal('https://github.com/tropy/tropy/issues')
      })

      .on('app:open-dialog', (win, options = {}) => {
        dialog.showOpenDialog(win, {
          ...options,
          defaultPath: app.getPath('userData'),
          filters: [{ name: 'Tropy Projects', extensions: ['tpy'] }],
          properties: ['openFile']

        }, files => {
          if (files) this.open(...files)
        })
      })

    app
      .on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
      })

      .on('quit', () => {
        verbose('saving app state')
        this.persist()
      })

    if (process.platform === 'darwin') {
      app.on('activate', () => this.open())
    }

    ipc
      .on('cmd', (_, command, ...params) => this.emit(command, ...params))

      .on(OPENED, (_, project) => this.opened(project))
      .on(CREATED, (_, project) => this.open(project.file))

    return this
  }

  get hash() {
    return {
      environment: this.environment,
      debug: this.debug,
      home: app.getPath('userData'),
      frameless: this.state.frameless,
      locale: this.state.locale
    }
  }


  get debug() {
    return process.env.DEBUG === 'true'
  }

  get environment() {
    return process.env.NODE_ENV
  }

  get version() {
    return pkg.version
  }
}

module.exports = Tropy
