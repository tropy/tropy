import fs from 'node:fs'
import { resolve } from 'node:path'
import { app, ipcMain as ipc, BrowserWindow } from 'electron'
import { info, warn } from '../common/log.js'
import { protocolURL, urlId as getUrlId } from '../common/util.js'
import { PROJECT } from '../constants/index.js'
import dialog from './dialog.js'
import * as act from './actions.js'
import * as shell from './shell.js'

const fromEvent = (event) =>
  BrowserWindow.fromWebContents(event.sender)

// The renderer reports failures to open a project itself.
const warnOpenFailed = (err) =>
  warn({ err }, `failed to open project: ${err.message}`)

export class ProjectRegistry {
  #projects = new WeakMap()  // win -> project
  #pending = new Map()       // path -> { win, window, opened }

  constructor (app) {
    this.app = app
  }

  get wm () {
    return this.app.wm
  }

  start () {
    ipc
      .on(PROJECT.OPENED, this.handleProjectOpened)
      .on(PROJECT.UPDATE, this.handleProjectUpdated)
      .on(PROJECT.CLOSED, this.handleProjectClosed)
      .on('switch-project', this.handleSwitchProject)

    this.wm.on('closed', this.handleWindowClosed)

    this.app
      .on('app:create-project', this.handleCreateProject)
      .on('app:open-dialog', this.handleOpenDialog)
      .on('app:show-project-file', this.handleShowProjectFile)
      .on('app:clear-recent-projects', this.handleClearRecentProjects)
  }

  stop () {
    ipc
      .off(PROJECT.OPENED, this.handleProjectOpened)
      .off(PROJECT.UPDATE, this.handleProjectUpdated)
      .off(PROJECT.CLOSED, this.handleProjectClosed)
      .off('switch-project', this.handleSwitchProject)

    this.wm.off('closed', this.handleWindowClosed)

    this.app
      .off('app:create-project', this.handleCreateProject)
      .off('app:open-dialog', this.handleOpenDialog)
      .off('app:show-project-file', this.handleShowProjectFile)
      .off('app:clear-recent-projects', this.handleClearRecentProjects)
  }

  get recent () {
    return this.app.state.recent
  }

  // The path of the most recent existing project with the URL id.
  // The legacy id 'current' is the project in the current project window.
  find (urlId) {
    if (urlId === 'current')
      return this.get(this.wm.current('project'))?.path ?? null

    let id = encodeURIComponent(urlId.toWellFormed().normalize())

    return this.recent.find(file =>
      getUrlId(file) === id && fs.existsSync(file)) ?? null
  }

  // The path of the most recent existing project.
  latest () {
    return this.recent.find(file => fs.existsSync(file)) ?? null
  }

  // What Tropy knows about the project at path.
  describe (path) {
    return {
      urlId: getUrlId(path),
      path,
      open: this.window(path) != null,
      url: protocolURL(path)
    }
  }

  // The recent projects, most recent first.
  list () {
    return this.recent.map(path => this.describe(path))
  }

  // Removes projects from the recent projects; open projects stay.
  clear (paths) {
    let open = new Set(this.wm.map('project', win => this.get(win)?.path))

    this.#setRecent(this.recent.filter(file =>
      open.has(file) || (paths && !paths.includes(file))))
  }

  // Projects in windows

  // The project open in win.
  get (win = this.wm.current()) {
    return this.#projects.get(win) ?? null
  }

  // The window that has the project at path open.
  window (path) {
    return this.wm.map('project').find(win => this.get(win)?.path === path)
  }

  // Opening projects

  // Shows the window of the project at path.
  // If the project is not open or opening, opens it in win.
  // Without win, opens it in the current project window if that is empty,
  // otherwise in a new window.
  // Without a path, shows win, the empty current or a new project window.
  // The meta is passed on with the project.open action,
  // e.g. create ({ name }) to create the project first
  // or silent to suppress error dialogs.
  async show (path, win, meta = {}) {
    if (path) {
      path = resolve(path)

      // No await unless pending:
      // concurrent calls must see the new pending open
      // before this call tracks another one.
      let pending = this.#pending.get(path)
      let open = this.window(path) ?? (pending && await pending.window)

      if (open) {
        info({ path }, 'focus existing project window')
        open.show()
        return open
      }
    }

    win ??= this.#empty()

    if (win == null) {
      if (meta.create) {
        win = this.#createWindow()

        // Track the window right away, so that closing it settles the open,
        // but send the action once it is ready: earlier actions are lost.
        win
          .then(async w => {
            await w.ready
            this.app.dispatch(act.project.open(path, meta), w)
          })
          .catch(() => {})
      } else {
        win = this.#createWindow(path)
      }

    } else {
      info({ path }, 'open project in window')

      if (path)
        this.app.dispatch(act.project.open(path, meta), win)

      win.show()
    }

    if (path)
      this.#track(path, win)

    return win
  }

  // Like show, but resolves once the project is open.
  async open (path, win, meta) {
    path = resolve(path)

    let shown = this.show(path, win, meta)
    let pending = this.#pending.get(path)

    win = await shown
    await pending?.opened.promise

    return win
  }

  // Resolves a project URL id to a project window,
  // opening the project if necessary.
  // Returns null if there is no such project.
  // The legacy id 'current' is the active project window
  // or else the most recent project.
  async openById (urlId) {
    let path = this.find(urlId) ??
      ((urlId === 'current') ? this.latest() : null)

    return path ? this.open(path) : null
  }

  async openLatest () {
    return this.show(this.latest())
  }

  // Lets the user pick a project file; null if cancelled.
  async pick (win = null) {
    let { cancel, value: files } = await dialog.open(win, {
      filters: [{
        name: this.app.dict.dialog.file.project,
        extensions: ['tpy', 'tropy']
      }]
    })

    return cancel ? null : files[0]
  }

  // Handlers

  handleProjectOpened = (event, project) => {
    let win = fromEvent(event)

    if (!this.wm.is(win, 'project'))
      return

    this.#projects.set(win, project)

    if (this.#isPending(project.path, win))
      this.#settle(project.path)

    this.wm.close(['prefs'])

    switch (process.platform) {
      case 'darwin':
        if (!this.app.state.frameless)
          win.setRepresentedFilename(project.path)
        app.addRecentDocument(project.path)
        break
      case 'win32':
        app.addRecentDocument(project.path)
        break
    }

    if (project.isManaged)
      shell.setProjectFolderIcon(project.path)

    this.app.setHistory(null, win)
    this.#setTitle(win, project)

    this.#setRecent([
      project.path,
      ...this.recent.filter(file => file !== project.path)
    ])
  }

  handleProjectUpdated = (event, project) => {
    let win = fromEvent(event)

    if (!this.wm.is(win, 'project'))
      return

    this.#projects.set(win, project)
    this.#setTitle(win, project)
    this.#updateMenu(win)
  }

  handleProjectClosed = (event, { path, error }) => {
    let win = fromEvent(event)

    if (error)
      warn({ error, path }, `project closed with error: ${error.message}`)

    if (this.#isPending(path, win))
      this.#settle(path, error ?
        Object.assign(new Error(error.message), error) :
        new Error('project open canceled'))

    if (this.get(win)?.path === path) {
      this.#projects.delete(win)
      this.#setTitle(win, null)
      this.#updateMenu(win)
    }
  }

  handleWindowClosed = (type, win) => {
    for (let [path, pending] of this.#pending) {
      if (pending.win === win)
        this.#settle(path, new Error('window closed'))
    }
  }

  // Opens a converted or optimized copy in place of the original.
  handleSwitchProject = async (_, path, old) => {
    await this.wm.close('prefs')
    await this.show(path, this.window(old)).catch(warnOpenFailed)
  }

  handleCreateProject = async () => {
    await this.show().catch(warnOpenFailed)
  }

  handleOpenDialog = async () => {
    let file = await this.pick(this.wm.current())

    if (file)
      await this.show(file).catch(warnOpenFailed)
  }

  handleShowProjectFile = (win, { target } = {}) => {
    let path = target?.path ?? this.get(win)?.path
    if (path) shell.show(path)
  }

  handleClearRecentProjects = (_, { target } = {}) => {
    this.clear(target ? [target.path] : undefined)
  }

  // The current project window,
  // if it has no project and is not opening one.
  #empty () {
    let win = this.wm.current('project')

    if (win == null || this.get(win))
      return null

    // Windows still being created are not known yet:
    // the current window might be one of them.
    for (let pending of this.#pending.values()) {
      if (pending.win === win || pending.win == null)
        return null
    }

    return win
  }

  // Tracks opening path in win, or the window being created,
  // until the window reports the project open or closed.
  #track (path, win) {
    let pending = {
      // Known right away for existing windows, so that
      // they no longer count as empty.
      win: (win instanceof Promise) ? null : win,
      opened: Promise.withResolvers()
    }

    pending.window = Promise.resolve(win).then(
      (w) => (pending.win = w),
      (err) => {
        this.#settle(path, err)
        throw err
      })

    // Nobody may wait for these, e.g. after show.
    pending.window.catch(() => {})
    pending.opened.promise.catch(() => {})

    this.#pending.set(path, pending)
  }

  // Whether win is opening path.
  // Renderers may report a new window's project
  // before main knows the window.
  #isPending (path, win) {
    let pending = this.#pending.get(path)
    return pending != null && (pending.win ?? win) === win
  }

  #settle (path, error) {
    let pending = this.#pending.get(path)

    if (pending == null)
      return

    this.#pending.delete(path)

    if (error)
      pending.opened.reject(error)
    else
      pending.opened.resolve()
  }

  #createWindow (file) {
    info({ file }, 'open new project window')

    return this.wm.open('project', {
      file,
      recent: this.recent,
      ...this.app.hash
    }, {
      show: 'init',
      title: 'Tropy',
      // TODO fixed size if no file (and small size if no recent)
      fixedSize: file ? undefined : {
        width: 440 * (this.recent.length ? 2 : 1),
        height: 580,
        animate: false
      },
      ...(this.wm.has('project') ? {} : this.app.state.win.bounds)
    })
  }

  #setRecent (list) {
    this.app.state.recent = list
    this.wm.send('project', 'recent', list)
    this.app.menu.reload()
  }

  #setTitle (win, project) {
    if (this.app.state.frameless)
      return

    win.setTitle(project == null ?
      this.app.name :
      [
        project.name,
        project.isReadOnly ? this.app.dict.window.project.readOnly : ''
      ].join(''))
  }

  #updateMenu (win) {
    if (win === this.wm.current())
      this.app.menu.handleWindowChange(win)
  }
}
