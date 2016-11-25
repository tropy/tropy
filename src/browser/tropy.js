'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')
const { app, shell, ipcMain: ipc, BrowserWindow } = require('electron')
const { verbose } = require('../common/log')
const { open } = require('./window')
const { all } = require('bluebird')
const { existsSync: exists } = require('fs')
const { into, compose, remove, take } = require('transducers.js')

const { AppMenu, ContextMenu } = require('./menu')
const { Cache } = require('../common/cache')
const Storage = require('./storage')
const dialog = require('./dialog')

const release = require('../common/release')

const { defineProperty: prop } = Object
const { OPENED, CREATED } = require('../constants/project')
const { CONTEXT } = require('../constants/ui')
const act = require('../actions')
const { HISTORY, TAG } = require('../constants')
const { darwin } = require('../common/os')

const H = new WeakMap()
const T = new WeakMap()

class Tropy extends EventEmitter {

  static defaults = {
    frameless: darwin,
    locale: app.getLocale(),
    theme: 'light',
    recent: [],
    win: {}
  }

  // eslint-disable-next-line constructor-super
  constructor() {
    if (Tropy.instance) return Tropy.instance

    super()
    Tropy.instance = this

    this.menu = new AppMenu(this)
    this.ctx = new ContextMenu(this)

    prop(this, 'cache', {
      value: new Cache(app.getPath('userData'), 'cache')
    })

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
        if (file) {
          this.dispatch(act.project.open(file))
        }

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
      width: 456,
      height: 580,
      parent: this.win,
      modal: !darwin && !!this.win,
      autoHideMenuBar: true,
      resizable: false,
      minimizable: false,
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

      .tap(() => all([
        this.menu.load(), this.ctx.load(), this.cache.init()
      ]))

      .tap(() => this.emit('app:restored'))
      .tap(() => verbose('app state restored'))
  }

  persist() {
    return this.store.save.sync('state.json', this.state), this
  }

  listen() {
    this
      .on('app:create-project', () =>
        this.create())
      .on('app:import-photos', () =>
        this.dispatch(act.item.import()))
      .on('app:rename-project', () =>
        this.dispatch(act.ui.edit.start({ project: { name: true } })))
      .on('app:show-in-folder', (_, { target }) =>
        shell.showItemInFolder(target.file))
      .on('app:create-item', () =>
        this.dispatch(act.item.create()))
      .on('app:delete-item', (_, { target }) =>
        this.dispatch(act.item.delete(target.id)))
      .on('app:restore-item', (_, { target }) =>
        this.dispatch(act.item.restore(target.id)))
      .on('app:destroy-item', (_, { target }) =>
        this.dispatch(act.item.destroy(target.id)))
      .on('app:create-item-photo', (_, { target }) =>
        this.dispatch(act.photo.create({ item: target.id })))
      .on('app:toggle-item-tag', (_, { id, tag }) =>
        this.dispatch(act.item.tags.toggle({ id, tags: [tag] })))
      .on('app:clear-item-tags', (_, { id }) =>
        this.dispatch(act.item.tags.clear(id)))
      .on('app:rename-photo', (_, { target }) =>
        this.dispatch(act.ui.edit.start({ photo: target.id })))
      .on('app:delete-photo', (_, { target }) =>
        this.dispatch(act.photo.delete({
          item: target.item, photos: [target.id]
        })))
      .on('app:create-list', () =>
        this.dispatch(act.list.new()))
      .on('app:rename-list', (_, { target: id }) =>
        this.dispatch(act.ui.edit.start({ list: { id } })))
      .on('app:delete-list', (_, { target }) =>
        this.dispatch(act.list.delete(target)))
      .on('app:create-tag', () =>
        this.dispatch(act.tag.new()))
      .on('app:rename-tag', (_, { target: id }) =>
        this.dispatch(act.ui.edit.start({ tag: { id } })))
      .on('app:delete-tag', (_, { target }) =>
        this.dispatch(act.tag.hide(target)))

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

        this.emit('app:reload-menu')
      })


      .on('app:reload-menu', () => {
        // Note: there may be Electron issues when reloading
        // the main menu. But since we cannot remove items
        // dynamically (#527) this is our only option.
        this.menu.reload()
      })

      .on('app:undo', () => {
        if (this.history.past) this.dispatch(act.history.undo())
      })
      .on('app:redo', () => {
        if (this.history.future) this.dispatch(act.history.redo())
      })

      .on('app:inspect', (win, { x, y }) => {
        if (win) {
          win.webContents.inspectElement(x, y)
        }
      })


      .on('app:open-license', () => {
        shell.openExternal('https://github.com/tropy/tropy/blob/master/LICENSE')
      })

      .on('app:search-issues', () => {
        shell.openExternal('https://github.com/tropy/tropy/issues')
      })

      .on('app:open-dialog', (win, options = {}) => {
        dialog
          .show('open', win, {
            ...options,
            defaultPath: app.getPath('userData'),
            filters: [{ name: 'Tropy Projects', extensions: ['tpy'] }],
            properties: ['openFile']

          })
          .then(files => {
            if (files) this.open(...files)
          })
      })


    let quit = false

    app
      .once('before-quit', () => { quit = true })

      .on('window-all-closed', () => {
        if (quit || !darwin) app.quit()
      })
      .on('quit', () => {
        verbose('saving app state')
        this.persist()
      })

    if (darwin) {
      app.on('activate', () => this.open())
    }

    ipc
      .on('cmd', (_, command, ...params) => this.emit(command, ...params))

      .on(OPENED, (_, { file }) => this.opened({ file }))
      .on(CREATED, (_, { file }) => this.open(file))

      .on(HISTORY.CHANGED, (_, history) => {
        H.set(this.win, history)
        this.emit('app:reload-menu')
      })
      .on(TAG.CHANGED, (_, tags) => {
        T.set(this.win, tags)
      })

      .on(CONTEXT.SHOW, (_, event) => {
        this.ctx.show(event)
        this.dispatch(act.ui.context.clear())
      })

    dialog.start()

    return this
  }

  get hash() {
    return {
      environment: ARGS.environment,
      debug: ARGS.debug,
      dev: this.dev,
      home: app.getPath('userData'),
      cache: this.cache.root,
      frameless: this.state.frameless,
      theme: this.state.theme,
      locale: this.state.locale
    }
  }


  dispatch(action) {
    if (this.win) {
      this.win.webContents.send('dispatch', action)
    }
  }

  get history() {
    return H.get(this.win) || {}
  }

  get tags() {
    return T.get(this.win) || []
  }

  get name() {
    return release.product
  }

  get dev() {
    return release.channel === 'dev' || ARGS.environment === 'development'
  }

  get version() {
    return release.version
  }
}

module.exports = Tropy
