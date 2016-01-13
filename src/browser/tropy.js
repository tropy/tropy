'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')
const { app, shell, ipcMain: ipc } = require('electron')
const { verbose } = require('../common/log')
const { Observable } = require('@reactivex/rxjs')
const AppMenu = require('./menu')
const Window = require('./window')
const Storage = require('./storage')

const pkg = require('../../package')

const { defineProperty: prop } = Object

module.exports = class Tropy extends EventEmitter {

  constructor({ environment, debug } = {}) {
    if (Tropy.instance) return Tropy.instance

    super()
    Tropy.instance = this

    this.menu = new AppMenu(this)
    this.menu.load('app')

    prop(this, 'store', { value: new Storage() })

    prop(this, 'debug', { value: debug })
    prop(this, 'environment', { value: environment || process.env.NODE_ENV })

    prop(this, 'home', {
      value: resolve(__dirname, '..', '..')
    })

    prop(this, 'hash', {
      value: { environment, debug, home: app.getPath('userData') }
    })

    this.restore()
    this.listen()
  }

  open() {
    if (!this.win) {
      this.win = new Window()
        .once('closed', () => { this.win = undefined })
        .open('index.html', this.hash)

    } else {
      this.win.show()
    }

    return this
  }

  restore() {
    return this.store
      .load('state.json')
      .catch({ code: 'ENOENT' }, () => ({}))

      .then(state => {
        this.state = state
        this.emit('app:restore')
      })
  }

  persist() {
    return this.store.save.sync('state.json', this.state), this
  }

  listen() {
    this
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

    app
      .on('window-all-closed', () => {
        if (process.platform !== 'darwin') this.emit('app:quit')
      })
      .on('before-quit', () => {
        verbose('saving app state')
        this.persist()
      })

    if (process.platform === 'darwin') {
      app
        .on('activate', () => this.open())
    }

    ipc
      .on('command', (_, command) => this.emit(command))

    Observable.zip(
        Observable.fromEvent(app, 'ready'),
        Observable.fromEvent(this, 'app:restore'))
      .take(1)
      .subscribe(() => this.open())
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
