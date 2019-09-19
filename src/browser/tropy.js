'use strict'

const { EventEmitter } = require('events')
const { extname, join } = require('path')

const {
  app,
  clipboard,
  shell,
  ipcMain: ipc,
  BrowserWindow,
  systemPreferences: prefs
} = require('electron')

const { fatal, info, warn, logger, crashReport } = require('../common/log')
const { delay, once } = require('../common/util')
const { existsSync: exists } = require('fs')
const { into, compose, remove, take } = require('transducers.js')

const { AppMenu, ContextMenu } = require('./menu')
const { Cache } = require('../common/cache')
const { Plugins } = require('../common/plugins')
const { Strings } = require('../common/res')
const Storage = require('./storage')
const Updater = require('./updater')
const dialog = require('./dialog')
const WindowManager = require('./wm')
const { addIdleObserver } = require('./idle')
const { migrate } = require('./migrate')

const { defineProperty: prop } = Object
const act = require('./actions')
const { darwin, linux } = require('../common/os')
const { channel, product, version } = require('../common/release')

const {
  FLASH, HISTORY, TAG, PROJECT, CONTEXT, LOCALE
} = require('../constants')

const H = new WeakMap()
const T = new WeakMap()


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

  constructor(opts = {}) {
    super()

    if (Tropy.instance)
      return Tropy.instance
    if (!opts.data)
      throw new Error('missing data folder')

    Tropy.instance = this

    this.opts = opts
    this.menu = new AppMenu(this)
    this.ctx = new ContextMenu(this)
    this.wm = new WindowManager()
    this.updater = new Updater({
      enable: process.env.NODE_ENV === 'production' && opts['auto-updates']
    })

    prop(this, 'cache', {
      value: new Cache(opts.cache || join(opts.data, 'cache'))
    })

    prop(this, 'store', {
      value: new Storage(opts.data)
    })

    prop(this, 'projects', {
      value: new Map()
    })

    prop(this, 'plugins', {
      value: new Plugins(join(opts.data, 'plugins'))
    })
  }

  async start() {
    await this.restore()
    this.listen()
    this.wm.start()
  }

  stop() {
    this.updater.stop()
    this.plugins.stop()
    this.persist()
  }

  open(file) {
    if (file != null) {
      return this.openFile(file)
    }

    let win = this.wm.current()
    if (win != null) {
      win.show()

    } else if (this.state.recent.length === 0) {
      this.showWizardWindow()

    } else {
      let recent = this.state.recent[0]
      if (exists(recent))
        this.showProjectWindow(recent)
      else
        this.showProjectWindow()
    }

    return false
  }

  openFile(file) {
    switch (extname(file)) {
      case '.tpy':
        this.showProjectWindow(file)
        break
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.svg':
        this.import({ files: [file] })
        break
      case '.ttp':
        this.importTemplates([file])
        break
      default:
        return false
    }
    return true
  }

  async showOpenDialog(win = this.wm.current()) {
    let files = await dialog.open(win, {
      defaultPath: app.getPath('documents'),
      filters: [{
        name: this.dict.dialog.file.project,
        extensions: ['tpy']
      }]
    })

    if (files) {
      await this.showProjectWindow(files[0], win)
    }
  }

  async showProjectWindow(file, win = this.wm.current()) {
    if (win == null) {
      info({ file }, 'open new project window')

      let args = {
        file,
        recent: this.state.recent,
        ...this.hash
      }

      let bounds = this.wm.has('project') ?
        {} : this.state.win.bounds

      await this.wm.open('project', args, {
        show: 'init',
        title: '',
        ...bounds
      })

    } else {
      info({ file }, 'open project in current window')

      if (file) {
        this.dispatch(act.project.open(file), win)
      }

      win.show()
    }

    this.emit('app:reload-menu')
  }

  hasOpenedProject({ file, name }, win) {
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

    this.wm.send('project', 'recent', this.state.recent)
    this.emit('app:reload-menu')
  }

  import(...args) {
    return this.dispatch(act.item.import(...args), this.wm.current())
  }

  importTemplates(files) {
    return this.dispatch(
      act.ontology.template.import({ files }),
      this.wm.first(['prefs', 'project']))
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
      title: this.dict.window.about.title,
      parent: this.wm.current(),
      modal: linux
    })
  }

  showWizardWindow() {
    this.wm.close('prefs')
    this.wm.show('wizard', this.hash, {
      title: this.dict.window.wizard.title,
      parent: this.wm.current(),
      modal: linux
    })
  }

  showPreferencesWindow() {
    this.wm.show('prefs', this.hash, {
      alwaysOnTop: darwin,
      isExclusive: !darwin,
      title: this.dict.window.prefs.title,
      parent: this.wm.current()
    })
  }

  async restore() {
    this.state = await this.migrate(
      await this.store.load('state.json', Tropy.defaults))

    await Promise.all([
      this.load(),
      this.cache.init(),
      this.plugins.init()
    ])

    this.plugins.watch()

    if (this.state.updater) {
      this.updater.start()
    }

    if (darwin) {
      prefs.setAppLevelAppearance(
        this.state.theme === 'system' ? null : this.state.theme
      )
    }

    info('app state restored')
  }

  load() {
    return Promise.all([
      this.menu.load(),
      this.ctx.load(),
      Strings
        .openWithFallback(LOCALE.default, this.state.locale)
        .then(strings => this.strings = strings)
    ])
  }

  migrate(state) {
    if (state.version == null)
      this.isFirstRun = true
    else
      migrate(this, state, state.version)

    state.locale = this.getLocale(state.locale)
    state.uuid = state.uuid || require('uuid/v1')()
    state.version = this.version

    return state
  }

  persist() {
    info('saving app state')

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
      this.dispatch(act.project.close('user'), this.wm.current()))

    this.on('app:optimize-cache', () => {
      this.dispatch(act.cache.prune(), this.wm.current())
      this.dispatch(act.cache.purge(), this.wm.current())
    })

    this.on('app:rebase-project', () =>
      this.dispatch(act.project.rebase(), this.wm.current()))

    this.on('app:reindex-project', () =>
      this.dispatch(act.project.reindex(), this.wm.current()))

    this.on('app:optimize-project', () =>
      this.dispatch(act.project.optimize(), this.wm.current()))

    this.on('app:import', () =>
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

    this.on('app:show-in-folder', (_, { target }) => {
      if (target.protocol !== 'file')
        shell.openExternal(`${target.protocol}://${target.path}`)
      else
        shell.showItemInFolder(target.path)
    })

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

    this.on('app:create-field', (win, { target }) =>
      this.dispatch(act.metadata.new({
        id: target.id
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
      info('clear recent projects')
      this.state.recent = []
      this.emit('app:reload-menu')
    })

    this.on('app:switch-theme', (_, theme) => {
      this.setTheme(theme)
    })

    this.on('app:switch-locale', async (_, locale) => {
      info(`switch to "${locale}" locale`)
      this.state.locale = locale
      await this.load()
      this.updateWindowLocale()
      this.emit('app:reload-menu')
    })

    this.on('app:toggle-debug-flag', () => {
      info('toggling dev/debug mode...')
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
      shell.showItemInFolder(this.log)
    })

    this.on('app:open-user-data', () => {
      shell.showItemInFolder(join(this.opts.data, 'state.json'))
    })

    this.on('app:open-plugins-folder', () => {
      shell.showItemInFolder(this.plugins.configFile)
    })

    this.on('app:open-cache-folder', () => {
      shell.openItem(this.cache.root)
    })

    this.on('app:install-plugin', (win) => {
      dialog
        .open(darwin ? null : win, {
          defaultPath: app.getPath('downloads'),
          filters: [{
            name: this.dict.dialog.file.plugin,
            extensions: Plugins.ext
          }]
        })
        .then(plugins => {
          if (plugins) return this.plugins.install(...plugins)
        })
    })

    this.on('app:reset-ontology-db', () => {
      if (this.wm.has(['project', 'prefs']))
        dialog.warn(this.wm.first(['prefs', 'project']), {
          message: 'Cannot reset ontology db while in use!'
        })
      else
        require('rimraf')
          .sync(join(this.opts.data, 'ontology.db'))
    })

    this.on('app:open-dialog', () => {
      this.showOpenDialog()
    })

    this.on('app:open-new-dialog', () => {
      this.showOpenDialog(null)
    })

    this.on('app:print', () => {
      this.dispatch(act.item.print(), this.wm.current())
    })

    this.on('app:zoom-in', () => {
      this.state.zoom = this.wm.zoom(this.state.zoom + 0.25)
    })

    this.on('app:zoom-out', () => {
      this.state.zoom = this.wm.zoom(this.state.zoom - 0.25)
    })

    this.on('app:zoom-reset', () => {
      this.state.zoom = this.wm.zoom(1)
    })

    this.plugins.on('change', () => {
      this.wm.broadcast('plugins-reload')
      this.emit('app:reload-menu')
    })

    app.on('gpu-process-crashed', (_, killed) => {
      if (!killed) {
        warn('GPU process crashed unexpectedly')
      }
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
        for (let id of ids) prefs.unsubscribeNotification(id)
      })
    }

    ipc.on('cmd', (event, cmd, ...args) => {
      this.emit(cmd, BrowserWindow.fromWebContents(event.sender), ...args)
    })

    ipc.on('print', async (_, opts) => {
      try {
        if (!opts.items.length) return

        var win = await this.wm.open('print', this.hash)

        await Promise.race([
          once(win, 'react:ready'),
          delay(2000)
        ])

        info(`will print ${opts.items.length} item(s)`)
        win.send('print', opts)

        await Promise.race([
          once(win, 'print:ready'),
          delay(60000)
        ])

        let result = await WindowManager.print(win)
        info(`printing ${result ? 'confirmed' : 'aborted'}`)

      } finally {
        if (win != null) win.destroy()
      }
    })

    ipc.on('error', (event, error) => {
      this.handleUncaughtException(
        error,
        BrowserWindow.fromWebContents(event.sender))
    })

    ipc.on(PROJECT.OPENED, (event, project) =>
      this.hasOpenedProject(
        project,
        BrowserWindow.fromWebContents(event.sender)))

    ipc.on(PROJECT.CREATE, () => this.showWizardWindow())
    ipc.on(PROJECT.CREATED, (_, { file }) => this.showProjectWindow(file))

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

    this.wm.on('show', () => {
      this.emit('app:reload-menu')
    })

    this.wm.on('focus-change', () => {
      this.emit('app:reload-menu')
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
      this.emit('app:reload-menu')
    })

    this.wm.on('unresponsive', (_, win) => {
      dialog
        .warn(win, this.dict.dialog.unresponsive)
        .then(res => {
          switch (res) {
            case 0: return win.destroy()
          }
        })
    })

    this.wm.on('crashed', (_, win) => {
      dialog
        .warn(win, this.dict.dialog.crashed)
        .then(({ response }) => {
          switch (response) {
            case 0:
              win.destroy()
              break
            case 1:
              app.relaunch()
              app.quit()
              break
            case 2:
              shell.openItem(this.log)
              break
          }
        })
    })

    this.updater
      .on('checking-for-updates', () => {
        this.emit('app:reload-menu')
      })
      .on('update-not-available', () => {
        this.emit('app:reload-menu')
      })
      .on('update-ready', (release) => {
        this.wm.broadcast('dispatch', act.flash.show(release))
      })

    app.whenReady().then(() => {
      addIdleObserver((_, type, time) => {
        this.wm.broadcast('idle', { type, time })
      }, 60)
    })

    return this
  }

  handleUncaughtException(e, win = BrowserWindow.getFocusedWindow()) {
    fatal(e)

    if (!this.dev) {
      dialog
        .alert(win, {
          ...this.dict.dialog.unhandled,
          detail: e.stack
        })
        .then(({ response }) => {
          switch (response) {
            case 1:
              clipboard.write({ text: crashReport(e) })
              break
            case 2:
              shell.openItem(this.log)
              break
          }
        })
    }
  }

  get hash() {
    return {
      data: this.opts.data,
      debug: this.debug,
      dev: this.dev,
      cache: this.cache.root,
      plugins: this.plugins.root,
      frameless: this.state.frameless,
      theme: this.state.theme,
      level: logger.level,
      locale: this.state.locale,
      log: this.log,
      uuid: this.state.uuid,
      update: this.updater.release,
      version,
      webgl: this.state.webgl,
      zoom: this.state.zoom
    }
  }

  updateWindowLocale() {
    this.wm.setTitle('about', this.dict.window.about.title)
    this.wm.setTitle('prefs', this.dict.window.prefs.title)
    this.wm.setTitle('wizard', this.dict.window.wizard.title)
    this.wm.broadcast('locale', this.state.locale)
  }

  setTheme(theme = this.state.theme) {
    info(`switch to "${theme}" theme`)
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
      return true
    }
    return false
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

  get log() {
    return join(app.getPath('logs'), 'tropy.log')
  }

  get name() {
    return product
  }

  get dev() {
    return channel === 'dev' || process.env.NODE_ENV === 'development'
  }

  get debug() {
    return this.opts.debug || this.state.debug
  }

  get version() {
    return version
  }
}

module.exports = Tropy
