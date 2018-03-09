'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')

const {
  app, shell, ipcMain: ipc, BrowserWindow, systemPreferences: pref
} = require('electron')

const { verbose, warn } = require('../common/log')
const { open, hasOverlayScrollBars } = require('./window')
const { all } = require('bluebird')
const { existsSync: exists } = require('fs')
const { join } = require('path')
const { into, compose, remove, take } = require('transducers.js')
const rm = require('rimraf')
const uuid = require('uuid/v1')

const { AppMenu, ContextMenu } = require('./menu')
const { Cache } = require('../common/cache')
const { Plugins } = require('../common/plugins')
const { Strings } = require('../common/res')
const Storage = require('./storage')
const Updater = require('./updater')
const dialog = require('./dialog')

const { defineProperty: prop } = Object
const act = require('../actions')
const { darwin } = require('../common/os')
const { channel, product, version } = require('../common/release')
const { restrict } = require('../common/util')

const {
  FLASH, HISTORY, TAG, PROJECT, CONTEXT, SASS, LOCALE
} = require('../constants')

const WIN = SASS.PROJECT
const WIZ = SASS.WIZARD
const ABT = SASS.ABOUT
const PREFS = SASS.PREFS

const H = new WeakMap()
const T = new WeakMap()

const ZOOM = { STEP: 0.25, MAX: 2, MIN: 0.75 }


class Tropy extends EventEmitter {
  static defaults = {
    frameless: darwin,
    debug: false,
    theme: 'light',
    recent: [],
    updater: true,
    win: {},
    zoom: 1.0
  }

  constructor() {
    super()

    if (Tropy.instance) return Tropy.instance
    Tropy.instance = this

    this.menu = new AppMenu(this)
    this.ctx = new ContextMenu(this)

    this.updater = new Updater(this)

    prop(this, 'cache', {
      value: new Cache(app.getPath('userData'), 'cache')
    })

    prop(this, 'store', { value: new Storage() })

    prop(this, 'projects', { value: new Map() })

    prop(this, 'home', {
      value: resolve(__dirname, '..', '..')
    })

    prop(this, 'plugins', {
      value: new Plugins(join(app.getPath('userData'), 'plugins'))
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

      if (!file) return this.showWizard()
    }

    try {
      file = resolve(file)
      verbose(`opening ${file}...`)

      if (this.win) {
        if (file) {
          this.dispatch(act.project.open(file), this.win)
        }

        return this.win.show(), this
      }

      this.win = open('project', { file, ...this.hash }, {
        width: WIN.WIDTH,
        height: WIN.HEIGHT,
        minWidth: WIN.MIN_WIDTH * this.state.zoom,
        minHeight: WIN.MIN_HEIGHT * this.state.zoom,
        darkTheme: (this.state.theme === 'dark'),
        frame: !this.hash.frameless
      }, this.state.zoom)

      this.win
        .on('unresponsive', async () => {
          warn(`win#${this.win.id} has become unresponsive`)

          const chosen = await dialog.show('message-box', this.win, {
            type: 'warning',
            ...this.dict.dialogs.unresponsive
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
            ...this.dict.dialogs.crashed
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

  hasOpened({ file, name }) {
    if (this.wiz) this.wiz.close()
    if (this.prefs) this.prefs.close()

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
    this.dispatch(act.item.import(), this.win)
  }

  showAboutWindow() {
    if (this.about) return this.about.show(), this

    this.about = open('about', this.hash, {
      title: this.dict.windows.about.title,
      width: ABT.WIDTH * this.state.zoom,
      height: ABT.HEIGHT * this.state.zoom,
      parent: darwin ? null : this.win,
      modal: !darwin && !!this.win,
      autoHideMenuBar: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      darkTheme: (this.state.theme === 'dark'),
      frame: !this.hash.frameless
    }, this.state.zoom)
      .once('closed', () => { this.about = undefined })

    return this
  }

  showWizard() {
    if (this.prefs) this.prefs.close()
    if (this.wiz) return this.wiz.show(), this

    this.wiz = open('wizard', this.hash, {
      title: this.dict.windows.wizard.title,
      width: WIZ.WIDTH * this.state.zoom,
      height: WIZ.HEIGHT * this.state.zoom,
      parent: darwin ? null : this.win,
      modal: !darwin && !!this.win,
      autoHideMenuBar: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      darkTheme: (this.state.theme === 'dark'),
      frame: !this.hash.frameless,
    }, this.state.zoom)
      .once('closed', () => { this.wiz = undefined })

    return this
  }

  showPreferences() {
    if (this.prefs) return this.prefs.show(), this

    this.prefs = open('prefs', this.hash, {
      title: this.dict.windows.prefs.title,
      width: PREFS.WIDTH * this.state.zoom,
      height: PREFS.HEIGHT * this.state.zoom,
      parent: darwin ? null : this.win,
      modal: !darwin && !!this.win,
      autoHideMenuBar: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      darkTheme: (this.state.theme === 'dark'),
      frame: !this.hash.frameless
    }, this.state.zoom)
      .once('closed', () => {
        this.prefs = undefined
        this.dispatch(act.ontology.load(), this.win)
        this.dispatch(act.storage.reload([['settings']]), this.win)
      })

    return this
  }

  restore() {
    return all([
      this.store.load('state.json')
    ])
      .then(([state]) => ({ ...Tropy.defaults, ...state }))
      .catch({ code: 'ENOENT' }, () => Tropy.defaults)

      .then(state => this.migrate(state))

      .tap(() => all([
        this.load(),
        this.cache.init(),
        this.plugins.init()
      ]))

      .tap(() => this.plugins.watch())
      .tap(state => state.updater && this.updater.start())

      .tap(() => this.emit('app:restored'))
      .tap(() => verbose('app state restored'))
  }

  load() {
    return all([
      this.menu.load(),
      this.ctx.load(),
      Strings
        .openWithFallback(LOCALE.default, this.state.locale)
        .then(strings => this.strings = strings)
    ])
  }

  migrate(state) {
    state.locale = this.getLocale(state.locale)
    state.version = this.version
    state.uuid = state.uuid || uuid()

    this.state = state
    return this
  }

  persist() {
    verbose('saving app state')

    if (this.state != null) {
      this.store.save.sync('state.json', this.state)
    }

    return this
  }

  listen() {
    this.on('app:about', () =>
      this.showAboutWindow())

    this.on('app:create-project', () =>
      this.showWizard())

    this.on('app:close-project', () =>
      this.win && this.dispatch(act.project.close('debug')))

    this.on('app:import-photos', () =>
      this.import())

    this.on('app:rename-project', () =>
      this.dispatch(act.edit.start({ project: { name: true } })))

    this.on('app:show-in-folder', (_, { target }) =>
      shell.showItemInFolder(target.path))

    this.on('app:create-item', () =>
      this.dispatch(act.item.create()))

    this.on('app:delete-item', (_, { target }) =>
      this.dispatch(act.item.delete(target.id)))

    this.on('app:merge-item', (_, { target }) =>
      this.dispatch(act.item.merge(target.id)))

    this.on('app:explode-item', (_, { target }) =>
      this.dispatch(act.item.explode({ id: target.id })))

    this.on('app:explode-photo', (_, { target }) =>
      this.dispatch(act.item.explode({ id: target.item, photos: [target.id] })))

    this.on('app:export-item', (_, { target, plugin }) =>
      this.dispatch(act.item.export(target.id, { plugin })))

    this.on('app:restore-item', (_, { target }) =>
      this.dispatch(act.item.restore(target.id)))

    this.on('app:destroy-item', (_, { target }) =>
      this.dispatch(act.item.destroy(target.id)))

    this.on('app:create-item-photo', (_, { target }) =>
      this.dispatch(act.photo.create({ item: target.id })))

    this.on('app:toggle-item-tag', (_, { id, tag }) =>
      this.dispatch(act.item.tags.toggle({ id, tags: [tag] })))

    this.on('app:clear-item-tags', (_, { id }) =>
      this.dispatch(act.item.tags.clear(id)))

    this.on('app:list-item-remove', (_, { target }) =>
      this.dispatch(act.list.items.remove({
        id: target.list,
        items: target.id
      })))

    this.on('app:rename-photo', (_, { target }) =>
      this.dispatch(act.edit.start({ photo: target.id })))
    this.on('app:delete-photo', (_, { target }) =>
      this.dispatch(act.photo.delete({
        item: target.item, photos: [target.id]
      })))
    this.on('app:duplicate-photo', (_, { target }) =>
      this.dispatch(act.photo.duplicate({
        item: target.item, photos: [target.id]
      })))
    this.on('app:consolidate-photo-library', () =>
      this.dispatch(act.photo.consolidate(null, { force: true })))

    this.on('app:consolidate-photo', (_, { target }) =>
      this.dispatch(act.photo.consolidate([target.id], {
        force: true, prompt: true
      })))

    this.on('app:delete-selection', (_, { target }) =>
      this.dispatch(act.selection.delete({
        photo: target.id, selections: [target.selection]
      })))

    this.on('app:create-list', () =>
      this.dispatch(act.list.new()))

    this.on('app:rename-list', (_, { target: id }) =>
      this.dispatch(act.edit.start({ list: { id } })))

    this.on('app:delete-list', (_, { target }) =>
      this.dispatch(act.list.delete(target)))

    this.on('app:create-tag', () =>
      this.dispatch(act.tag.new()))

    this.on('app:rename-tag', (_, { target }) =>
      this.dispatch(act.tag.edit(target)))

    this.on('app:save-tag', (_, tag) =>
      this.dispatch(act.tag.save(tag)))

    this.on('app:delete-item-tag', (_, { target }) =>
      this.dispatch(act.item.tags.delete({
        id: target.items, tags: [target.id]
      })))
    this.on('app:delete-tag', (_, { target }) =>
      this.dispatch(act.tag.delete(target.id)))

    this.on('app:create-note', (_, { target }) =>
      this.dispatch(act.note.create(target)))

    this.on('app:delete-note', (_, { target }) =>
      this.dispatch(act.note.delete(target)))

    this.on('app:toggle-line-wrap', (_, { target }) =>
      this.dispatch(act.ui.update({
        note: { [target.id]: { wrap: !target.wrap } }
      })))
    this.on('app:toggle-line-numbers', (_, { target }) =>
      this.dispatch(act.ui.update({
        note: { [target.id]: { numbers: !target.numbers } }
      })))
    this.on('app:writing-mode', (_, { id, mode }) =>
      this.dispatch(act.ui.update({ note: { [id]: { mode  } } })))

    this.on('app:toggle-menu-bar', win => {
      if (win.isMenuBarAutoHide()) {
        win.setAutoHideMenuBar(false)
      } else {
        win.setAutoHideMenuBar(true)
        win.setMenuBarVisibility(false)
      }
    })

    this.on('app:clear-recent-projects', () => {
      verbose('clearing recent projects...')
      this.state.recent = []
      this.emit('app:reload-menu')
    })

    this.on('app:switch-theme', (_, theme) => {
      verbose(`switching to "${theme}" theme...`)
      this.state.theme = theme
      this.broadcast('theme', theme)
      this.emit('app:reload-menu')
    })

    this.on('app:switch-locale', async (_, locale) => {
      verbose(`switching to "${locale}" locale...`)
      this.state.locale = locale
      await this.load()
      this.updateWindowLocale()
      this.emit('app:reload-menu')
    })

    this.on('app:toggle-debug-flag', () => {
      verbose('toggling dev/debug mode...')
      this.state.debug = !this.state.debug
      this.broadcast('debug', this.state.debug)
      this.emit('app:reload-menu')
    })

    this.on('app:check-for-updates', () => {
      this.updater.check()
    })

    this.on('app:install-updates', () => {
      this.updater.install()
    })

    this.on('app:reload-menu', () => {
      // Note: there may be Electron issues when reloading
      // the main menu. But since we cannot remove items
      // dynamically (#527) this is our only option.
      this.menu.reload()
    })

    this.on('app:undo', () => {
      if (this.history.past) {
        this.dispatch({
          type: HISTORY.UNDO,
          meta: { ipc: HISTORY.CHANGED }
        })
      }
    })

    this.on('app:redo', () => {
      if (this.history.future) {
        this.dispatch({
          type: HISTORY.REDO,
          meta: { ipc: HISTORY.CHANGED }
        })
      }
    })

    this.on('app:inspect', (win, { x, y }) => {
      if (win != null) win.webContents.inspectElement(x, y)
    })

    this.on('app:open-preferences', () => {
      this.showPreferences()
    })

    this.on('app:open-license', () => {
      shell.openExternal('https://tropy.org/license')
    })

    this.on('app:search-issues', () => {
      shell.openExternal('https://github.com/tropy/tropy/issues')
    })

    this.on('app:open-docs', () => {
      shell.openExternal('https://docs.tropy.org')
    })

    this.on('app:open-forums', () => {
      shell.openExternal('https://forums.tropy.org')
    })

    this.on('app:open-logs', () => {
      shell.showItemInFolder(join(app.getPath('userData'), 'log', 'main.log'))
    })

    this.on('app:open-plugins-config', () => {
      shell.openItem(this.plugins.configFile)
    })

    this.on('app:install-plugin', async () => {
      const plugins = await dialog.show('file', this.win, {
        defaultPath: app.getPath('downloads'),
        filters: [{ name: 'Tropy Plugins', extensions: Plugins.ext }],
        properties: ['openFile']
      })

      if (plugins != null) await this.plugins.install(...plugins)
    })

    this.on('app:open-plugins-folder', () => {
      shell.showItemInFolder(this.plugins.configFile)
    })

    this.on('app:reset-ontology-db', () => {
      if (this.win || this.prefs) {
        this.dispatch(act.ontology.reset())
      } else {
        rm.sync(join(app.getPath('userData'), 'ontology.db'))
      }
    })

    this.on('app:open-dialog', (win, options = {}) => {
      dialog
        .show('file', win, {
          ...options,
          defaultPath: app.getPath('userData'),
          filters: [{ name: 'Tropy Projects', extensions: ['tpy'] }],
          properties: ['openFile']

        }).then(files => {
          if (files) this.open(...files)
        })
    })

    this.on('app:zoom-in', () => {
      this.zoom(this.state.zoom + ZOOM.STEP)
    })

    this.on('app:zoom-out', () => {
      this.zoom(this.state.zoom - ZOOM.STEP)
    })

    this.on('app:zoom-reset', () => {
      this.zoom(1.0)
    })

    this.plugins.on('change', () => {
      this.broadcast('plugins-reload')
      this.emit('app:reload-menu')
    })

    let quit = false
    let winId

    app.on('browser-window-focus', (_, win) => {
      try {
        if (winId !== win.id) this.emit('app:reload-menu')
      } finally {
        winId = win.id
      }
    })

    app.once('before-quit', () => { quit = true })

    app.on('window-all-closed', () => {
      if (quit || !darwin) app.quit()
    })

    app.on('quit', () => {
      this.updater.stop()
      this.plugins.stop()
      this.persist()
    })

    if (darwin) {
      app.on('activate', () => this.open())

      const ids = [
        pref.subscribeNotification(
          'AppleShowScrollBarsSettingChanged', () =>
            this.broadcast('scrollbars', !hasOverlayScrollBars()))
      ]

      app.on('quit', () => {
        for (let id of ids) pref.unsubscribeNotification(id)
      })
    }

    ipc.on('cmd', (_, command, ...params) => this.emit(command, ...params))

    ipc.on(PROJECT.OPENED, (_, project) => this.hasOpened(project))
    ipc.on(PROJECT.CREATE, () => this.showWizard())
    ipc.on(PROJECT.CREATED, (_, { file }) => this.open(file))

    ipc.on(FLASH.HIDE, (_, { id, confirm }) => {
      if (id === 'update.ready' && confirm) {
        this.updater.install()
      }
    })

    ipc.on(PROJECT.UPDATE, (_, { name }) => {
      if (name) this.win.setTitle(name)
    })

    ipc.on(HISTORY.CHANGED, (event, history) => {
      H.set(BrowserWindow.fromWebContents(event.sender), history)
      this.emit('app:reload-menu')
    })

    ipc.on(TAG.CHANGED, (event, tags) => {
      T.set(BrowserWindow.fromWebContents(event.sender), tags)
      this.emit('app:reload-menu')
    })

    ipc.on(CONTEXT.SHOW, (_, event) => {
      this.ctx.show(event)
    })

    dialog.start()

    return this
  }

  get hash() {
    return {
      environment: ARGS.environment,
      debug: this.debug,
      dev: this.dev,
      home: app.getPath('userData'),
      documents: app.getPath('documents'),
      cache: this.cache.root,
      plugins: this.plugins.root,
      frameless: this.state.frameless,
      theme: this.state.theme,
      locale: this.state.locale,
      uuid: this.state.uuid,
      update: this.updater.release,
      version
    }
  }

  zoom(factor) {
    this.state.zoom = restrict(factor, ZOOM.MIN, ZOOM.MAX)

    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.setZoomFactor(this.state.zoom)
    }
  }

  updateWindowLocale() {
    const { dict, about, prefs, wiz } = this
    if (about != null) about.setTitle(dict.windows.about.title)
    if (prefs != null) prefs.setTitle(dict.windows.prefs.title)
    if (wiz != null) wiz.setTitle(dict.windows.wizard.title)
    this.broadcast('locale', this.state.locale)
  }

  dispatch(action, win = BrowserWindow.getFocusedWindow()) {
    if (win != null) {
      win.webContents.send('dispatch', action)
    }
  }

  broadcast(...args) {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(...args)
    }
  }

  getLocale(locale) {
    return LOCALE[locale || app.getLocale()] || LOCALE.default
  }

  get defaultLocale() {
    return this.getLocale()
  }

  get dict() {
    return this.strings.dict
  }

  get history() {
    return H.get(BrowserWindow.getFocusedWindow()) || {}
  }

  get tags() {
    return T.get(BrowserWindow.getFocusedWindow()) || []
  }

  get name() {
    return product
  }

  get dev() {
    return channel === 'dev' || ARGS.environment === 'development'
  }

  get isBuild() {
    return ARGS.environment === 'production'
  }

  get debug() {
    return ARGS.debug || this.state.debug
  }

  get version() {
    return version
  }
}

module.exports = Tropy
