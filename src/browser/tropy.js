'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')
const { app, dialog, shell, ipcMain: ipc, BrowserWindow } = require('electron')
const { verbose } = require('../common/log')
const { open } = require('./window')
const { existsSync: exists } = require('fs')
const { into, compose, remove, take } = require('transducers.js')

const AppMenu = require('./menu')
const Storage = require('./storage')

const release = require('../common/release')

const { defineProperty: prop } = Object
const { OPEN, OPENED, CREATED, HISTORY } = require('../constants/project')

const H = new WeakMap()

class Tropy extends EventEmitter {

  static get defaults() {
    return {
      frameless: (process.platform === 'darwin'),
      locale: app.getLocale(),
      theme: 'light',
      recent: [],
      win: {}
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

  open(file) {
    if (!file) {
      if (this.win) return this.win.show(), this

      file = this.state.recent[0]
      if (!file || !exists(file)) return this.create()
    }

    try {
      file = resolve(file)
      verbose(`opening ${file}...`)


      if (this.win) {
        if (file) this.win.webContents.send(OPEN, file)
        return this.win.show(), this
      }


      this.win = open('project', { file, ...this.hash }, {
        width: 1280,
        height: 720,
        minWidth: 640,
        minHeight: 480,
        darkTheme: (this.state.theme === 'dark'),
        frame: !this.hash.frameless
      })
        .on('close', () => {
          if (!this.win.isFullScreen()) {
            this.state.win.bounds = this.win.getBounds()
          }
        })
        .once('closed', () => { this.win = undefined })

      if (this.state.win.bounds) {
        this.win.setBounds(this.state.win.bounds)
      }

      return this

    } finally {
      this.emit('app:reload-menu')
    }
  }

  opened({ file }) {
    if (this.wiz) this.wiz.close()

    this.state.recent = into([file],
        compose(remove(f => f === file), take(9)), this.state.recent)

    switch (process.platform) {
      case 'darwin':
      case 'win32':
        app.addRecentDocument(file)
        break
    }

    this.emit('app:reload-menu')
  }

  create() {
    if (this.wiz) return this.wiz.show(), this

    this.wiz = open('wizard', this.hash, {
      width: 920,
      height: 680,
      parent: this.win,
      modal: !!this.win,
      autoHideMenuBar: true,
      maximizable: false,
      fullscreenable: false,
      darkTheme: (this.state.theme === 'dark'),
      frame: !this.hash.frameless
    })
      .once('closed', () => { this.wiz = undefined })

    return this
  }

  restore() {
    return this.store
      .load('state.json')
      .then(state => ({ ...Tropy.defaults, ...state }))
      .catch({ code: 'ENOENT' }, () => Tropy.defaults)

      .then(state => (this.state = state, this))

      .tap(() => this.emit('app:reload-menu'))
      .tap(() => this.emit('app:restored'))
      .tap(() => verbose('app state restored'))
  }

  persist() {
    return this.store.save.sync('state.json', this.state), this
  }

  listen() {
    this
      .on('app:new-project', () => this.create())

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
        this.emit('app:reload-menu')
      })

      .on('app:switch-theme', (_, theme) => {
        verbose(`switching to "${theme}" theme...`)

        this.state.theme = theme

        for (let win of BrowserWindow.getAllWindows()) {
          win.webContents.send('theme', theme)
        }

        if (this.development || this.debug) {
          const tm = this.menu.find(['dev', 'theme']).submenu

          for (let item of tm.items) {
            item.checked = (item.id === theme)
          }
        }
      })


      .on('app:reload-menu', () => {
        // Note: there may be Electron issues when reloading
        // the main menu. But since we cannot remove items
        // dynamically (#527) this is our only option.
        this.menu.load()
      })

      .on('app:reload', () => {
        const win = BrowserWindow.getFocusedWindow()

        if (win) {
          win.webContents.send('reload')
        }
      })

      .on('app:refresh', () => {
        const win = BrowserWindow.getFocusedWindow()

        if (win) {
          win.webContents.send('refresh')
        }
      })

      .on('app:undo', () => {
        if (!this.history.past) return
      })

      .on('app:redo', () => {
        if (!this.history.future) return
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


    let quit = false

    app
      .once('before-quit', () => { quit = true })

      .on('window-all-closed', () => {
        if (quit || process.platform !== 'darwin') app.quit()
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

      .on(HISTORY, (_, history) => {
        H.set(this.win, history)
        this.emit('app:reload-menu')
      })

    return this
  }

  get hash() {
    return {
      environment: this.environment,
      debug: this.debug,
      dev: this.dev,
      home: app.getPath('userData'),
      frameless: this.state.frameless,
      theme: this.state.theme,
      locale: this.state.locale
    }
  }


  get history() {
    return H.get(this.win) || {}
  }

  get name() {
    return release.product
  }

  get debug() {
    return process.env.DEBUG === 'true'
  }

  get dev() {
    return release.channel === 'dev' || this.environment === 'development'
  }

  get environment() {
    return process.env.NODE_ENV
  }

  get version() {
    return release.version
  }
}

module.exports = Tropy
