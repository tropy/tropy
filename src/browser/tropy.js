import assert from 'assert'
import fs from 'fs'
import { EventEmitter } from 'events'
import { extname, join } from 'path'
import { fileURLToPath } from 'url'
import { v1 as uuid } from 'uuid'
import { into, compose, remove, take } from 'transducers.js'

import {
  app,
  clipboard,
  shell,
  ipcMain as ipc,
  nativeTheme,
  BrowserWindow,
  session,
  systemPreferences as prefs
} from 'electron'

import {
  crashReport,
  debug,
  fatal,
  info,
  logger,
  warn
} from '../common/log'


import { darwin, linux } from '../common/os'
import { delay, once } from '../common/util'
import { channel, product, version } from '../common/release'
import { Cache } from '../common/cache'
import { Plugins } from '../common/plugins'
import { Strings } from '../common/res'

import { AppMenu, ContextMenu } from './menu'
import { Storage } from './storage'
import { Updater } from './updater'
import dialog from './dialog'
import { Server as ApiServer } from './api'
import { WindowManager } from './wm'
import { addIdleObserver } from './idle'
import { migrate } from './migrate'
import * as act from './actions'

import {
  FLASH, HISTORY, TAG, PROJECT, CONTEXT, LOCALE
} from '../constants'

const H = new WeakMap()
const T = new WeakMap()
const P = new WeakMap()


export class Tropy extends EventEmitter {
  static defaults = {
    fontSize: '13px',
    frameless: darwin,
    debug: false,
    port: 2019,
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

    this.api = new ApiServer(this)
    this.cache = new Cache(opts.cache || join(opts.data, 'cache'))
    this.ctx = new ContextMenu(this)
    this.menu = new AppMenu(this)
    this.plugins = new Plugins(join(opts.data, 'plugins'))
    this.projects = new Map()
    this.store = new Storage(opts.data)
    this.updater = new Updater({
      enable: process.env.NODE_ENV === 'production' && opts.autoUpdates
    })

    this.wm = new WindowManager()
  }

  async start() {
    await this.restore()
    this.listen()
    this.wm.start()
    await this.api.start()
    // await this.loadDevToolExtensions()
  }

  stop() {
    this.api.stop()
    this.updater.stop()
    this.plugins.stop()
    this.persist()
  }

  async open(...urls) {
    for (let url of urls) {
      switch (url.protocol) {
        case 'file:':
          await this.showProjectWindow(fileURLToPath(url), null)
          break
        case 'tropy:':
          await this.handleProtocolRequest(url)
          break
        default:
          throw new Error(`protocol not supported: ${url}`)
      }
    }

    let win = this.wm.current()
    if (win != null)
      return win.show()
    else
      return this.openMostRecentProject()
  }

  async openFile(...files) {
    for (let file of files) {
      switch (extname(file)) {
        case '.tpy':
          await this.showProjectWindow(file, null)
          break
        case '.ttp':
          await this.importTemplates([file])
          break
        default:
          if (this.wm.current())
            this.import({ files: [file] })
      }
    }
  }

  async openMostRecentProject() {
    if (this.state.recent.length === 0)
      return this.showWizardWindow()

    let recent = this.state.recent[0]
    if (fs.existsSync(recent))
      return this.showProjectWindow(recent)

    return this.showProjectWindow()
  }

  async showOpenDialog(win = this.wm.current()) {
    let files = await dialog.open(win, {
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

      // TODO focus project in existing window if it's already open!

      info({ file }, 'open new project window')

      let args = {
        file,
        recent: this.state.recent,
        ...this.hash
      }

      let bounds = this.wm.has('project') ?
        {} : this.state.win.bounds

      return this.wm.open('project', args, {
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
      return win
    }
  }

  hasOpenedProject(project, win) {
    this.wm.close(['wizard', 'prefs'])

    this.state.recent = into(
      [project.file],
      compose(remove(f => f === project.file), take(9)),
      this.state.recent)

    switch (process.platform) {
      case 'darwin':
        if (!this.state.frameless) {
          win.setRepresentedFilename(project.file)
        }
        app.addRecentDocument(project.file)
        break
      case 'win32':
        app.addRecentDocument(project.file)
        break
    }

    this.wm.send('project', 'recent', this.state.recent)
    this.setHistory(null, win)
    this.setProject(project, win)
    this.emit('app:reload-menu')
    this.emit('project:opened', project)
  }

  async import(...args) {
    if (this.getProject())
      return this.dispatch(act.item.import(...args), this.wm.current())
  }

  async importTemplates(files) {
    if (!this.wm.current())
      await this.showPreferencesWindow()

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
    let project = this.getProject()

    let args = {
      file: project?.file,
      ...this.hash
    }

    this.wm.show('prefs', args, {
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

    nativeTheme.themeSource = this.state.theme
    dialog.lastDefaultPath = this.state.lastDefaultPath

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
    state.uuid = state.uuid || uuid()
    state.version = this.version

    if (!(/^(system|dark|light)$/).test(state.theme))
      state.theme = 'system'

    return state
  }

  persist() {
    info('saving app state')

    if (this.state != null) {
      this.state.lastDefaultPath = dialog.lastDefaultPath
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

    this.on('app:reindex-project', () =>
      this.dispatch(act.project.reindex(), this.wm.current()))

    this.on('app:optimize-project', () =>
      this.dispatch(act.project.optimize(), this.wm.current()))

    this.on('app:import', () =>
      this.import())
    this.on('app:import-directory', () =>
      this.import({}, { prompt: 'dir' }))
    this.on('app:import-plugin', (win, { plugin }) =>
      this.import({}, { plugin }))

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

    this.on('app:open-path', (_, { target }) => {
      if (target.protocol !== 'file')
        shell.openExternal(`${target.protocol}://${target.path}`)
      else
        shell.openPath(target.path)
    })

    this.on('app:create-item', () =>
      this.dispatch(act.item.create(), this.wm.current()))

    this.on('app:delete-item', (win, { target }) =>
      this.dispatch(act.item.delete(target.id), win))

    this.on('app:consolidate-item', (win, { target }) =>
      this.dispatch(
        act.photo.consolidate(target.photos, {
          force: true,
          prompt: target.photos.length === 1
        }),
        win))

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
      this.dispatch(act.item.export(target?.id, { plugin }), win))

    this.on('app:restore-item', (win, { target }) => {
      this.dispatch(act.item.restore(target.id), win)
    })

    this.on('app:destroy-item', (win, { target }) => {
      this.dispatch(act.item.destroy(target.id), win)
    })

    this.on('app:create-item-photo', (win, { target }) => {
      this.dispatch(act.photo.create({ item: target.id }), win)
    })

    this.on('app:toggle-item-tag', (win, { id, tag }) => {
      this.dispatch(act.item.tags.toggle({ id, tags: [tag] }), win)
    })

    this.on('app:clear-item-tags', (win, { id }) => {
      this.dispatch(act.item.tags.clear(id), win)
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
    this.on('app:extract-photo', (win, { target }) =>
      this.dispatch(act.photo.extract({
        id: target.id,
        selection: target.selection
      }), win))
    this.on('app:consolidate-photo-library', () =>
      this.dispatch(act.photo.consolidate(), this.wm.current()))

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

    this.on('app:copy-note', (win, { target }) =>
      this.dispatch(
        act.note.export(target.notes, { target: ':clipboard:' }),
        win))

    this.on('app:copy-item-link', (win, { target }) =>
      this.copyProtocolURL(this.getProject(win), {
        item: target.id,
        photo: target.photos[0]
      }))

    this.on('app:copy-photo-link', (win, { target }) =>
      this.copyProtocolURL(this.getProject(win), {
        item: target.item,
        photo: target.id
      }))

    this.on('app:export-note', (win, { target }) =>
      this.dispatch(act.note.export(target.notes), win))

    this.on('app:export-notes', (win) =>
      this.dispatch(act.note.export(), win))

    this.on('app:copy-notes', (win) =>
      this.dispatch(
        act.note.export(undefined, { target: ':clipboard:' }),
        win))

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

    this.on('app:switch-theme', async (_, theme) => {
      await this.setTheme(theme)
    })

    this.on('app:change-font-size', (_, fontSize) => {
      this.state.fontSize = fontSize
      this.wm.broadcast('fontSize', this.state.fontSize)
    })

    this.on('app:switch-locale', async (_, locale) => {
      info(`switch to "${locale}" locale`)
      this.state.locale = locale
      await this.load()
      this.updateWindowLocale()
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
      if (this.getHistory(win)?.past) {
        this.dispatch({
          type: HISTORY.UNDO,
          meta: { ipc: HISTORY.CHANGED }
        }, win)
      }
    })

    this.on('app:redo', (win) => {
      if (this.getHistory(win)?.future) {
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

    this.on('app:donate', () => {
      shell.openExternal('https://tropy.org/donate')
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
      shell.openPath(this.cache.root)
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

    this.on('app:reset-ontology-db', async () => {
      if (this.wm.has(['project', 'prefs']))
        dialog.warn(this.wm.first(['prefs', 'project']), {
          message: 'Cannot reset ontology db while in use!'
        })
      else
          await fs.promises.unlink(join(this.opts.data, 'ontology.db'))
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

    nativeTheme.on('updated', async () => {
      await this.setTheme(nativeTheme.themeSource)
    })

    if (darwin) {
      app.on('activate', () => this.open())

      let ids = [
        prefs.subscribeNotification(
          'AppleShowScrollBarsSettingChanged',
          this.wm.handleScrollBarsChange)
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
          once(win, 'ready', 'react:ready'),
          delay(2000)
        ])

        info(`will print ${opts.items.length} item(s)`)
        win.send('print', opts)

        await Promise.race([
          once(win, 'print:ready'),
          delay(60000)
        ])

        // debug('will open print dialog')
        // let status = await WindowManager.print(win)
        // info(`print status: ${status}`)
        info('will print pdf')
        let pdf = await WindowManager.printToPDF(win)
        info(`saved pdf ${pdf}`)

      } finally {
        if (win != null) win.destroy()
      }
    })

    ipc.on('error', (event, error) => {
      this.handleUncaughtException(
        error,
        BrowserWindow.fromWebContents(event.sender))
    })

    ipc.on(PROJECT.OPENED, (event, project) => {
      let win = BrowserWindow.fromWebContents(event.sender)
      if (this.wm.is(win, 'project')) {
        this.hasOpenedProject(project, win)
      }
    })

    ipc.on(PROJECT.CREATE, () => this.showWizardWindow())
    ipc.on(PROJECT.CREATED, (_, { file }) => this.showProjectWindow(file))

    ipc.on(FLASH.HIDE, (_, { id, confirm }) => {
      if (id === 'update.ready' && confirm) {
        this.updater.install()
      }
    })

    ipc.on(PROJECT.UPDATE, (event, project) => {
      let win = BrowserWindow.fromWebContents(event.sender)
      if (this.wm.is(win, 'project')) {
        this.setProject(project, win)
      }
    })

    ipc.on(PROJECT.CLOSED, (event) => {
      this.setProject(
        null,
        BrowserWindow.fromWebContents(event.sender))
    })

    ipc.on(HISTORY.CHANGED, (event, history) => {
      this.setHistory(history, BrowserWindow.fromWebContents(event.sender))
    })

    ipc.on(TAG.CHANGED, (event, tags) => {
      this.setTags(tags, BrowserWindow.fromWebContents(event.sender))
    })

    ipc.on(CONTEXT.SHOW, (event, payload) => {
      this.showContextMenu(payload, BrowserWindow.fromWebContents(event.sender))
    })

    this.wm.on('show', this.menu.handleWindowChange)
    this.wm.on('focus-change', this.menu.handleWindowChange)

    this.wm.on('close', (type, win) => {
      if (type === 'project') {
        this.state.win.bounds = win.getNormalBounds()
      }
    })

    this.wm.on('closed', (type) => {
      if (type === 'prefs') {
        this.wm.send('project', 'dispatch',
          act.ontology.load(null, { replace: true }),
          act.project.reload(),
          act.storage.reload([['settings']]))
      }
      this.menu.handleWindowChange()
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
              shell.openPath(this.log)
              break
          }
        })
    })

    this.updater
      .on('checking-for-updates', this.menu.handleUpdaterChange)
      .on('update-not-available', this.menu.handleUpdaterChange)
      .on('update-ready', (release) => {
        this.menu.handleUpdaterChange()
        this.wm.broadcast('dispatch', act.flash.show(release))
      })

    app.whenReady().then(() => {
      addIdleObserver((_, type, time) => {
        this.wm.broadcast('idle', { type, time })
      }, 60)
    })

    return this
  }

  copyProtocolURL(project, { item, photo }) {
    let alias = 'current'

    clipboard.write({
      text: `tropy://project/${alias}/items/${item}/${photo}`
    })
  }

  async handleProtocolRequest(url) {
    info(`opening url ${url}`)

    switch (url.host) {
      case 'prefs':
      case 'preferences':
        await this.showPreferencesWindow()
        break

      case 'about':
      case 'version':
        await this.showAboutWindow()
        break

      case 'project': {
        // tropy://project(/:alias)/items/:id(/:photo)(/:selection)
        let [, alias = 'current', type, id, photo] =
          url.pathname.split('/')

        assert.equal(alias, 'current',
          `bad request: project alias '${alias}' unknown`)

        let win = this.wm.current()

        if (!win) {
          win = await this.openMostRecentProject()

          await Promise.race([
            once(this, 'project:opened'),
            delay(1500)
          ])
        }

        win.show()

        if (type) {
          assert.equal(type, 'items',
            `bad request: action type '${type}' unknown`)

          assert.ok(id, 'bad request: missing id')
          assert.ok(photo, 'bad request: missing photo')

          this.dispatch(act.item.open({
            id: parseInt(id, 10),
            photos: [parseInt(photo, 10)]
          }), win)
        }
        break
      }

      default:
        throw new Error(`bad request: host unknown: ${url}`)
    }
  }

  handleUncaughtException(e, win = BrowserWindow.getFocusedWindow()) {
    fatal(e)

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
            shell.openPath(this.log)
            break
        }
      })
  }

  get hash() {
    return {
      data: this.opts.data,
      debug: this.debug,
      dev: this.dev,
      cache: this.cache.root,
      plugins: this.plugins.root,
      fontSize: this.state.fontSize,
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

  async setTheme(theme = this.state.theme) {
    info(`switch to "${theme}" theme`)
    this.state.theme = theme

    if (theme !== nativeTheme.themeSource)
      nativeTheme.themeSource = theme

    this.wm.broadcast('theme', theme, {
      dark: nativeTheme.shouldUseDarkColors,
      contrast: nativeTheme.shouldUseHighContrastColors,
      vibrancy: !(await WindowManager.shouldReduceTransparency())
    })

    this.menu.handleThemeChange()
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
    return H.get(win)
  }

  setHistory(history, win = BrowserWindow.getFocusedWindow()) {
    if (history == null)
      H.delete(win)
    else
      H.set(win, history)

    if (win.isFocused())
      this.menu.handleHistoryChange(history)
  }

  findProject(file) {
    if (file == null)
      return this.getProject()

    for (let [win, project] of P) {
      if (file && project.file === file)
        return { ...project, win }
    }

    return null
  }

  getProject(win = this.wm.current()) {
    return P.get(win)
  }

  setProject(project, win = this.wm.current()) {
    if (project == null) {
      P.delete(win)

      if (!this.state.frameless)
        win.setTitle(this.name)

    } else {
      P.set(win, project)

      if (!this.state.frameless)
        win.setTitle([
          project.name,
          project.isReadOnly ? this.dict.window.project.readOnly : ''
        ].join(''))
    }
  }

  getTags(win = BrowserWindow.getFocusedWindow()) {
    return T.get(win) || []
  }

  setTags(tags, win = BrowserWindow.getFocusedWindow()) {
    return T.set(win, tags)
  }

  async loadDevToolExtensions() {
    try {
      let extensions = join(this.opts.data, 'extensions')

      for (let id of await fs.promises.readdir(extensions)) {
        session
          .defaultSession
          .loadExtension(join(extensions, id), { allowFileAccess: true })
      }
    } catch (e) {
      if (e.code !== 'ENOENT')
        warn({ stack: e.stack }, 'failed loading devtool extensions!')
    }
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
