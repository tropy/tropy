'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')

const {
  app,
  shell,
  ipcMain: ipc,
  BrowserWindow,
  systemPreferences: prefs
} = require('electron')

const { verbose, warn } = require('../common/log')
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
const WindowManager = require('./wm')

const { defineProperty: prop } = Object
const act = require('../actions')
const { darwin, linux } = require('../common/os')
const { channel, product, version } = require('../common/release')
const { restrict } = require('../common/util')

const {
  FLASH, HISTORY, TAG, PROJECT, CONTEXT, LOCALE
} = require('../constants')

const H = new WeakMap()
const T = new WeakMap()

const ZOOM = { STEP: 0.25, MAX: 2, MIN: 0.75 }


class Tropy extends EventEmitter {
  static defaults = {
    frameless: darwin,
    debug: false,
    theme: darwin ? 'system' : 'light',
    recent: [],
    updater: true,
    webgl: true,
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
    this.wm = new WindowManager()

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
    let win = this.wm.current()

    if (file == null) {
      if (win != null) {
        win.show()
      } else {
        for (let recent of this.state.recent) {
          if (exists(recent)) return this.open(recent)
        }
        this.showWizardWindow()
      }

    } else {
      file = resolve(file)
      verbose(`opening ${file}...`)

      if (win == null) {
        this.wm.show('project', { file, ...this.hash }, {
          title: '',
          ...this.state.win.bounds
        }).finally(() => {
          this.emit('app:reload-menu')
        })
      } else {
        this.dispatch(act.project.open(file), win)
        win.show()
        this.emit('app:reload-menu')
      }
    }
  }

  hasOpened({ file, name }, win) {
    this.wm.close(['wizard', 'prefs'])

    this.state.recent = into(
      [file],
      compose(remove(f => f === file), take(9)),
      this.state.recent)

    if (!this.state.frameless) {
      win.setTitle(name)
    }

    switch (process.platform) {
      case 'darwin':
        if (!this.state.frameless) {
          win.setRepresentedFilename(file)
        }
        app.addRecentDocument(file)
        break
      case 'win32':
        app.addRecentDocument(file)
        break
    }

    this.emit('app:reload-menu')
  }

  import(files) {
    this.dispatch(act.item.import({ files }), this.wm.current())
  }

  importTemplates(files) {
    this.dispatch(act.ontology.template.import({ files }))
  }

  showContextMenu(options, win) {
    this.ctx
      .show(options, win)
      .finally(() => {
        this.dispatch(act.context.clear(), win)
      })
  }

  showAboutWindow() {
    this.wm.show('about', this.hash, {
      title: this.dict.windows.about.title,
      parent: this.wm.current(),
      modal: linux
    })
  }

  showWizardWindow() {
    this.wm.close('prefs')
    this.wm.show('wizard', this.hash, {
      title: this.dict.windows.wizard.title,
      parent: this.wm.current(),
      modal: linux
    })
  }

  showPreferencesWindow() {
    this.wm.show('prefs', this.hash, {
      title: this.dict.windows.prefs.title,
      parent: this.wm.current()
    })
  }

  restore() {
    return all([
      this.store.load('state.json')
    ])
      .then(([state]) => ({ ...Tropy.defaults, ...state }))
      .catch({ code: 'ENOENT' }, () => Tropy.defaults)

      .then(state => this.migrate(state))
      .tap(state => this.state = state)

      .tap(() => all([
        this.load(),
        this.cache.init(),
        this.plugins.init()
      ]))

      .tap(() => this.plugins.watch())
      .tap(state => state.updater && this.updater.start())

      .tap(state => {
        if (darwin) {
          prefs.setAppLevelAppearance(
            state.theme === 'system' ? null : state.theme
          )
        }
      })

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
    return state
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
      this.showWizardWindow())

    this.on('app:close-project', () =>
      this.dispatch(act.project.close(), this.wm.current()))

    this.on('app:optimize-cache', () => {
      this.dispatch(act.cache.prune(), this.wm.current())
      this.dispatch(act.cache.purge(), this.wm.current())
    })

    this.on('app:rebase-project', () =>
      this.dispatch(act.project.rebase(), this.wm.current()))

    this.on('app:import-photos', () =>
      this.import())

    this.on('app:rename-project', (win) =>
      this.dispatch(act.edit.start({ project: { name: true } }), win))

    this.on('app:show-project-file', () => {
      if (this.state.recent.length > 0) {
        shell.showItemInFolder(this.state.recent[0])
      }
    })

    this.on('app:center-window', () =>
      this.wm.center())

    this.on('app:show-in-folder', (_, { target }) =>
      shell.showItemInFolder(target.path))

    this.on('app:create-item', () =>
      this.dispatch(act.item.create(), this.wm.current()))

    this.on('app:delete-item', (win, { target }) =>
      this.dispatch(act.item.delete(target.id), win))

    this.on('app:merge-item', (win, { target }) =>
      this.dispatch(act.item.merge(target.id), win))

    this.on('app:explode-item', (win, { target }) =>
      this.dispatch(act.item.explode({ id: target.id }), win))

    this.on('app:explode-photo', (win, { target }) => {
      this.dispatch(
        act.item.explode({ id: target.item, photos: [target.id] }),
        win)
    })

    this.on('app:export-item', (win, { target, plugin }) =>
      this.dispatch(act.item.export(target.id, { plugin }), win))

    this.on('app:restore-item', (win, { target }) => {
      this.dispatch(act.item.restore(target.id))
    })

    this.on('app:destroy-item', (win, { target }) => {
      this.dispatch(act.item.destroy(target.id))
    })

    this.on('app:create-item-photo', (win, { target }) => {
      this.dispatch(act.photo.create({ item: target.id }))
    })

    this.on('app:toggle-item-tag', (win, { id, tag }) => {
      this.dispatch(act.item.tags.toggle({ id, tags: [tag] }), win)
    })

    this.on('app:clear-item-tags', (win, { id }) => {
      this.dispatch(act.item.tags.clear(id))
    })

    this.on('app:list-item-remove', (win, { target }) => {
      this.dispatch(act.list.items.remove({
        id: target.list,
        items: target.id
      }), win)
    })

    this.on('app:rotate-item-left', (win, { target }) =>
      this.dispatch(act.photo.rotate({ id: target.photos, by: -90 }), win))

    this.on('app:rotate-item-right', (win, { target }) =>
      this.dispatch(act.photo.rotate({ id: target.photos, by: 90 }), win))

    this.on('app:rotate-photo-left', (win, { target }) =>
      this.dispatch(act.photo.rotate({ id: target.id, by: -90 }), win))

    this.on('app:rotate-photo-right', (win, { target }) =>
      this.dispatch(act.photo.rotate({ id: target.id, by: 90 }), win))

    this.on('app:rotate-selection-left', (win, { target }) =>
      this.dispatch(act.photo.rotate({
        id: target.selection, by: -90, type: 'selection'
      }), win))

    this.on('app:rotate-selection-right', (win, { target }) =>
      this.dispatch(act.photo.rotate({
        id: target.selection, by: 90, type: 'selection'
      }), win))

    this.on('app:rename-photo', (win, { target }) =>
      this.dispatch(act.edit.start({ photo: target.id }), win))
    this.on('app:delete-photo', (win, { target }) =>
      this.dispatch(act.photo.delete({
        item: target.item, photos: [target.id]
      }), win))
    this.on('app:duplicate-photo', (win, { target }) =>
      this.dispatch(act.photo.duplicate({
        item: target.item, photos: [target.id]
      }), win))
    this.on('app:consolidate-photo-library', () =>
      this.dispatch(act.photo.consolidate(null, { force: true }),
        this.wm.current()))

    this.on('app:consolidate-photo', (win, { target }) =>
      this.dispatch(act.photo.consolidate([target.id], {
        force: true, prompt: true
      }), win))

    this.on('app:delete-field', (win, { target }) =>
      this.dispatch(act.metadata.delete({
        id: target.id,
        property: target.property
      }), win))

    this.on('app:delete-selection', (win, { target }) =>
      this.dispatch(act.selection.delete({
        photo: target.id, selections: [target.selection]
      }), win))

    this.on('app:create-list', (win, { target = {} } = {}) =>
      this.dispatch(act.list.new({ parent: target.id }), win))

    this.on('app:rename-list', (win, { target }) =>
      this.dispatch(act.edit.start({ list: { id: target.id } }), win))

    this.on('app:delete-list', (win, { target }) =>
      this.dispatch(act.list.delete(target.id), win))

    this.on('app:create-tag', (win) =>
      this.dispatch(act.tag.new(), win))

    this.on('app:rename-tag', (win, { target }) =>
      this.dispatch(act.tag.edit(target), win))

    this.on('app:save-tag-color', (win, { target }, color) =>
      this.dispatch(act.tag.save({ id: target.id, color }), win))

    this.on('app:save-default-tag-color', (win, _, tagColor) =>
      this.dispatch(act.settings.persist({ tagColor }), win))

    this.on('app:export-tags', (win) =>
      this.dispatch(act.tag.export(), win))

    this.on('app:delete-item-tag', (win, { target }) =>
      this.dispatch(act.item.tags.delete({
        id: target.items, tags: [target.id]
      }), win))
    this.on('app:delete-tag', (win, { target }) =>
      this.dispatch(act.tag.delete(target.id), win))

    this.on('app:create-note', (win, { target }) =>
      this.dispatch(act.note.create(target), win))

    this.on('app:delete-note', (win, { target }) =>
      this.dispatch(act.note.delete(target), win))

    this.on('app:toggle-line-wrap', (win, { target }) =>
      this.dispatch(act.notepad.update({
        [target.id]: { wrap: !target.wrap }
      }), win))
    this.on('app:toggle-line-numbers', (win, { target }) =>
      this.dispatch(act.notepad.update({
        [target.id]: { numbers: !target.numbers }
      }), win))
    this.on('app:writing-mode', (win, { id, mode }) =>
      this.dispatch(act.notepad.update({ [id]: { mode  } }), win))

    this.on('app:settings-persist', (win, payload) =>
      this.dispatch(act.settings.persist(payload), win))

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
      this.setTheme(theme)
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
      this.wm.broadcast('debug', this.state.debug)
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

    this.on('app:undo', (win) => {
      if (this.getHistory(win).past) {
        this.dispatch({
          type: HISTORY.UNDO,
          meta: { ipc: HISTORY.CHANGED }
        }, win)
      }
    })

    this.on('app:redo', (win) => {
      if (this.getHistory(win).future) {
        this.dispatch({
          type: HISTORY.REDO,
          meta: { ipc: HISTORY.CHANGED }
        }, win)
      }
    })

    this.on('app:inspect', (win, { x, y }) => {
      if (win != null) win.webContents.inspectElement(x, y)
    })

    this.on('app:open-preferences', () => {
      this.showPreferencesWindow()
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

    this.on('app:open-user-data', () => {
      shell.showItemInFolder(join(app.getPath('userData'), 'state.json'))
    })

    this.on('app:open-plugins-folder', () => {
      shell.showItemInFolder(this.plugins.configFile)
    })

    this.on('app:install-plugin', async (win) => {
      const plugins = await dialog.show('file', darwin ? null : win, {
        defaultPath: app.getPath('downloads'),
        filters: [{ name: 'Tropy Plugin', extensions: Plugins.ext }],
        properties: ['openFile']
      })

      if (plugins != null) await this.plugins.install(...plugins)
    })

    this.on('app:reset-ontology-db', () => {
      if (this.wm.has(['project', 'prefs']))
        warn('cannot reset ontology db while in use')
      else
        rm.sync(join(app.getPath('userData'), 'ontology.db'))
    })

    this.on('app:open-dialog', (win, options = {}) => {
      dialog
        .show('file', win, {
          ...options,
          defaultPath: app.getPath('documents'),
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
      this.zoom(1)
    })

    this.plugins.on('change', () => {
      this.wm.broadcast('plugins-reload')
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

      let ids = [
        prefs.subscribeNotification(
          'AppleShowScrollBarsSettingChanged',
          this.wm.handleScrollBarsChange),
        prefs.subscribeNotification(
          'AppleInterfaceThemeChangedNotification',
          () => this.setTheme())
      ]

      app.on('quit', () => {
        for (let id of ids)
          prefs.unsubscribeNotification(id)
      })
    }

    ipc.on('cmd', (event, command, ...params) => {
      this.emit(command, BrowserWindow.fromWebContents(event.sender), ...params)
    })

    ipc.on(PROJECT.OPENED, (event, project) =>
      this.hasOpened(project, BrowserWindow.fromWebContents(event.sender)))

    ipc.on(PROJECT.CREATE, () => this.showWizardWindow())
    ipc.on(PROJECT.CREATED, (_, { file }) => this.open(file))

    ipc.on(FLASH.HIDE, (_, { id, confirm }) => {
      if (id === 'update.ready' && confirm) {
        this.updater.install()
      }
    })

    ipc.on(PROJECT.UPDATE, (event, { name }) => {
      if (!this.state.frameless)
        BrowserWindow.fromWebContents(event.sender).setTitle(name)
    })

    ipc.on(HISTORY.CHANGED, (event, history) => {
      this.setHistory(history, BrowserWindow.fromWebContents(event.sender))
      this.emit('app:reload-menu')
    })

    ipc.on(TAG.CHANGED, (event, tags) => {
      this.setTags(tags, BrowserWindow.fromWebContents(event.sender))
      this.emit('app:reload-menu')
    })

    ipc.on(CONTEXT.SHOW, (event, payload) => {
      this.showContextMenu(payload, BrowserWindow.fromWebContents(event.sender))
    })

    this.wm.on('close', (type, win) => {
      if (type === 'project') {
        this.state.win.bounds = win.getNormalBounds()
      }
    })

    this.wm.on('closed', (type) => {
      if (type === 'prefs') {
        this.wm.send('project', 'dispatch',
          act.ontology.load(),
          act.storage.reload([['settings']]))
      }
    })

    this.wm.on('unresponsive', async (_, win) => {
      let { response } = await dialog.show('message-box', win, {
        type: 'warning',
        ...this.dict.dialogs.unresponsive
      })

      switch (response) {
        case 0: return win.destroy()
      }
    })

    this.wm.on('crashed', async (_, win) => {
      let { response } = await dialog.show('message-box', win, {
        type: 'warning',
        ...this.dict.dialogs.crashed
      })

      switch (response) {
        case 0:
          win.destroy()
          break
        case 1:
          win.show()
          win.reload()
          break
        default:
          win.show()
          break
      }
    })

    this.wm.start()
    dialog.start()

    return this
  }

  get hash() {
    return {
      debug: this.debug,
      dev: this.dev,
      cache: this.cache.root,
      plugins: this.plugins.root,
      frameless: this.state.frameless,
      theme: this.state.theme,
      locale: this.state.locale,
      uuid: this.state.uuid,
      update: this.updater.release,
      version,
      webgl: this.state.webgl,
      zoom: this.state.zoom
    }
  }

  zoom(factor) {
    this.state.zoom = restrict(factor, ZOOM.MIN, ZOOM.MAX)

    for (let win of BrowserWindow.getAllWindows()) {
      win.webContents.setZoomFactor(this.state.zoom)
    }
  }

  updateWindowLocale() {
    this.wm.setTitle('about', this.dict.windows.about.title)
    this.wm.setTitle('prefs', this.dict.windows.prefs.title)
    this.wm.setTitle('wizard', this.dict.windows.wizard.title)
    this.wm.broadcast('locale', this.state.locale)
  }

  setTheme(theme = this.state.theme) {
    verbose(`switching to "${theme}" theme...`)
    this.state.theme = theme

    if (darwin) {
      prefs.setAppLevelAppearance(
        theme === 'system' ? null : theme
      )
    }

    this.wm.broadcast('theme', theme, prefs.isDarkMode())
    this.emit('app:reload-menu')
  }

  dispatch(action, win = BrowserWindow.getFocusedWindow()) {
    if (win != null) {
      win.webContents.send('dispatch', action)
    }
  }

  getLocale(locale) {
    return LOCALE[locale || app.getLocale()] || LOCALE.default
  }

  getHistory(win = BrowserWindow.getFocusedWindow()) {
    return H.get(win) || {}
  }

  setHistory(history, win = BrowserWindow.getFocusedWindow()) {
    return H.set(win, history)
  }

  getTags(win = BrowserWindow.getFocusedWindow()) {
    return T.get(win) || []
  }

  setTags(tags, win = BrowserWindow.getFocusedWindow()) {
    return T.set(win, tags)
  }


  get defaultLocale() {
    return this.getLocale()
  }

  get dict() {
    return this.strings.dict
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
