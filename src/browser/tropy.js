'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')
const { app, shell, ipcMain: ipc, BrowserWindow } = require('electron')
const { verbose, warn } = require('../common/log')
const { open } = require('./window')
const { all } = require('bluebird')
const { existsSync: exists } = require('fs')
const { into, compose, remove, take } = require('transducers.js')

const { AppMenu, ContextMenu } = require('./menu')
const { Cache } = require('../common/cache')
const { Strings } = require('../common/res')
const Storage = require('./storage')
const dialog = require('./dialog')

const release = require('../common/release')

const { defineProperty: prop } = Object
const act = require('../actions')
const { HISTORY, TAG, PROJECT, UI, ITEM } = require('../constants')
const { darwin } = require('../common/os')
const { version } = require('../common/release')

const H = new WeakMap()
const T = new WeakMap()

class Tropy extends EventEmitter {

  static defaults = {
    frameless: darwin,
    locale: app.getLocale() || 'en',
    theme: 'light',
    recent: [],
    win: {},
    version
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

      while (this.state.recent.length) {
        const recent = this.state.recent.shift()

        if (exists(recent)) {
          file = recent
          break
        }
      }

      if (!file) return this.create()
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

      this.win
        .on('unresponsive', async () => {
          warn(`win#${this.win.id} has become unresponsive`)

          const chosen = await dialog.show('message-box', this.win, {
            type: 'warning',
            ...this.strings.dict.dialogs.unresponsive
          })

          switch (chosen) {
            case 0: return this.win.destroy()
          }
        })

        .on('close', () => {
          if (!this.win.isFullScreen()) {
            this.state.win.bounds = this.win.getBounds()
          }
        })

        .on('closed', () => { this.win = undefined })

      this.win.webContents
        .on('crashed', async () => {
          warn(`win#${this.win.id} contents crashed`)

          const chosen = await dialog.show('message-box', this.win, {
            type: 'warning',
            ...this.strings.dict.dialogs.crashed
          })

          switch (chosen) {
            case 0: return this.win.close()
            case 1: return this.win.reload()
          }
        })


      if (this.state.win.bounds) {
        this.win.setBounds(this.state.win.bounds)
      }

      return this

    } finally {
      this.emit('app:reload-menu')
    }
  }

  opened({ file, name }) {
    if (this.wiz) this.wiz.close()

    this.state.recent = into([file],
        compose(remove(f => f === file), take(9)), this.state.recent)

    // if (darwin) this.win.setRepresentedFilename(file)
    if (name) this.win.setTitle(name)

    switch (process.platform) {
      case 'darwin':
      case 'win32':
        app.addRecentDocument(file)
        break
    }

    this.emit('app:reload-menu')
  }

  import() {
    if (this.win) {
      this.dispatch(act.item.import())
    }
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
    return all([
      this.store.load('state.json')
    ])
      .then(([state]) => ({ ...Tropy.defaults, ...state }))
      .catch({ code: 'ENOENT' }, () => Tropy.defaults)

      .then(state => (this.state = state, this))

      .tap(state => all([
        this.menu.load(),
        this.ctx.load(),
        this.cache.init(),
        Strings
          .openWithFallback(state.locale, Tropy.defaults.locale)
          .then(strings => this.strings = strings)
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
        this.import())
      .on('app:rename-project', () =>
        this.dispatch(act.ui.edit.start({ project: { name: true } })))
      .on('app:show-in-folder', (_, { target }) =>
        shell.showItemInFolder(target.path))
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
      .on('app:list-item-remove', (_, { target }) =>
        this.dispatch(act.list.items.remove({
          id: target.list,
          items: target.id
        })))
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
          .show('file', win, {
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

      .on(PROJECT.OPENED, (_, project) => this.opened(project))
      .on(PROJECT.CREATED, (_, { file }) => this.open(file))

      .on(PROJECT.UPDATE, (_, { name }) => {
        if (name) this.win.setTitle(name)
      })

      .on(HISTORY.CHANGED, (_, history) => {
        H.set(this.win, history)
        this.emit('app:reload-menu')
      })
      .on(TAG.CHANGED, (_, tags) => {
        T.set(this.win, tags)
      })

      .on(UI.CONTEXT.SHOW, (_, event) => {
        this.ctx.show(event)
        this.dispatch(act.ui.context.clear())
      })

      .on(ITEM.PREVIEW, (_, paths) => {
        if (darwin && paths && paths.length) {
          this.win.previewFile(paths[0])
        }
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
      documents: app.getPath('documents'),
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
