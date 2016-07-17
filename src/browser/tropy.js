'use strict'

const { EventEmitter } = require('events')
const { resolve, join } = require('path')
const { app, shell, ipcMain: ipc } = require('electron')
const { verbose, debug } = require('../common/log')
const { open } = require('./window')
const { Database } = require('../common/db')
const { into, compose, remove, take } = require('transducers.js')

const uuid = require('node-uuid')
const AppMenu = require('./menu')
const Storage = require('./storage')

const pkg = require('../../package')

const { defineProperty: prop } = Object

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
    this.menu.load('app')

    prop(this, 'store', { value: new Storage() })

    prop(this, 'projects', { value: new Map() })

    prop(this, 'home', {
      value: resolve(__dirname, '..', '..')
    })
  }

  open(file = this.state.recent[0]) {
    if (this.win) return this.win.show(), this
    if (!file) return this.create()

    file = resolve(file)

    debug(`opening ${file}...`)

    this.win = open('project', { file, ...this.hash }, {
      width: 1280,
      height: 720,
      frame: !this.hash.frameless
    })
      .once('closed', () => { this.win = undefined })


    return this
  }

  opened(file) {
    this.state.recent = into([file],
        compose(remove(f => f === file), take(9)), this.state.recent)

    switch (process.platform) {
      case 'darwin':
      case 'win32':
        app.addRecentDocument(file)
        break
    }
  }

  async create() {
    const file = join(app.getPath('userData'), 'dev.tpy')

    debug(`creating db ${file}...`)

    const db = new Database(file)

    await db.read(Database.schema)
    await db.run('INSERT INTO project (project_id,name) VALUES (?,?)',
          uuid.v4(), 'My Research')

    await db.close()

    this.open(file)
  }

  restore() {
    return this.store
      .load('state.json')
      .then(state => ({ ...Tropy.defaults, ...state }))
      .catch({ code: 'ENOENT' }, () => Tropy.defaults)

      .then(state => (this.state = state, this))

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
        verbose('toggle menu bar')

        if (win.isMenuBarAutoHide()) {
          win.setAutoHideMenuBar(false)
        } else {
          win.setAutoHideMenuBar(true)
          win.setMenuBarVisibility(false)
        }
      })

      .on('app:open-license', () => {
        shell.openExternal('https://github.com/tropy/tropy/blob/master/LICENSE')
      })

      .on('app:search-issues', () => {
        shell.openExternal('https://github.com/tropy/tropy/issues')
      })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit()
    })

    app.on('quit', () => {
      verbose('saving app state')
      this.persist()
    })

    if (process.platform === 'darwin') {
      app.on('activate', () => this.open())
    }

    ipc
      .on('cmd', (_, command) => this.emit(command))

      .on('file:opened', (_, file) => this.opened(file))
      .on('file:created', (_, file) => this.open(file))

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
