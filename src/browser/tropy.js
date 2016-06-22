'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')
const { app, shell, ipcMain: ipc } = require('electron')
const { verbose } = require('../common/log')
const { once } = require('../common/util')
const { Window } = require('./window')
const { all }  = require('bluebird')
const AppMenu = require('./menu')
const Storage = require('./storage')

const pkg = require('../../package')

const { defineProperty: prop } = Object


class Tropy extends EventEmitter {

  static get defaults() {
    return {
      frameless: (process.platform === 'darwin'),
      locale: app.getLocale()
    }
  }

  constructor({ environment, debug } = {}) { // eslint-disable-line constructor-super
    if (Tropy.instance) return Tropy.instance

    super()
    Tropy.instance = this

    this.menu = new AppMenu(this)
    this.menu.load('app')

    prop(this, 'store', { value: new Storage() })

    prop(this, 'debug', { value: debug || process.env.DEBUG === 'true' })
    prop(this, 'environment', { value: environment || process.env.NODE_ENV })

    prop(this, 'home', {
      value: resolve(__dirname, '..', '..')
    })

    this.restore()
    this.listen()
  }

  open() {
    if (this.win) return this.win.show(), this

    this.win = new Window({
      width: 1280,
      height: 720,
      useContentSize: true,
      frame: !this.hash.frameless
    })
      .once('closed', () => { this.win = undefined })
      .open('project.html', this.hash)

    return this
  }

  create() {
  }

  restore() {
    return this.store
      .load('state.json')
      .then(state => ({ ...Tropy.defaults, ...state }))
      .catch({ code: 'ENOENT' }, () => Tropy.defaults)

      .then(state => (this.state = state, this))

      .tap(() => this.emit('app:restore'))
      .tap(() => verbose('app state restored'))
  }

  persist() {
    return this.store.save.sync('state.json', this.state), this
  }

  listen() {
    this
      .on('app:new-archive', () => this.create())
      .on('app:quit', () => app.quit())

      .on('app:toggle-full-screen', win => {
        verbose('toggle fullscreen')
        win.setFullScreen(!win.isFullScreen())
      })

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
      if (process.platform !== 'darwin') this.emit('app:quit')
    })

    app.on('before-quit', () => {
      verbose('saving app state')
      this.persist()
    })

    if (process.platform === 'darwin') {
      app.on('activate', () => this.open())
    }

    ipc
      .on('command', (_, command) => this.emit(command))


    all([once(app, 'ready'), once(this, 'app:restore')])
      .then(() => this.open())
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


  get name() {
    return pkg.productName || pkg.name
  }

  get version() {
    return pkg.version
  }

  get development() {
    return this.environment === 'development'
  }
  get production() {
    return this.environment === 'production'
  }
}

module.exports = Tropy
