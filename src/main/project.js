import fs from 'node:fs'
import { resolve } from 'node:path'
import { app, ipcMain as ipc, BrowserWindow } from 'electron'
import { info, warn } from '../common/log.js'
import { urlId } from '../common/util.js'
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

  find (id) {
    id = encodeURIComponent(id.toWellFormed().normalize())
    return this.recent.find(file => urlId(file) === id && fs.existsSync(file))
  }

  last () {
    return this.recent.find(file => fs.existsSync(file))
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

  // Shows the window of the project at file. If the project is not
  // open or opening, opens it in win. Without win, opens it in the
  // current project window if that is empty, otherwise in a new window.
  // Without a file, shows win, the empty current or a new project window.
  async show (file, win) {
    if (file) {
      file = resolve(file)

      // No await unless pending: concurrent calls must see the new
      // pending open before this call tracks another one.
      let pending = this.#pending.get(file)
      let open = this.window(file) ?? (pending && await pending.window)

      if (open) {
        info({ file }, 'focus existing project window')
        open.show()
        return open
      }
    }

    win ??= this.#empty()

    if (win == null) {
      win = this.#createWindow(file)

    } else {
      info({ file }, 'open project in window')

      if (file)
        this.app.dispatch(act.project.open(file), win)

      win.show()
    }

    if (file)
      this.#track(file, win)

    return win
  }

  // Like show, but resolves once the project is open.
  async open (path, win) {
    path = resolve(path)

    let shown = this.show(path, win)
    let pending = this.#pending.get(path)

    win = await shown
    await pending?.opened.promise

    return win
  }

  // Resolves a project URL id to a project window, opening the project
  // if necessary. Returns null if there is no such project.
  // The legacy id 'current' is the active project window
  // or else the most recent project.
  async openById (id) {
    if (id === 'current') {
      let win = this.wm.current('project')

      if (this.get(win))
        return win

      let path = this.last()
      return path ? this.open(path) : null
    }

    let path = this.find(id)
    return path ? this.open(path) : null
  }

  async openMostRecent () {
    return this.show(this.last())
  }

  // Lets the user pick a project file; null if cancelled.
  async pick (win = null) {
    let { cancel, value: files } = await dialog.open(win, {
      filters: [{
        name: this.app.dict.dialog.file.project,
        extensions: ['tpy', 'tropy', 'mtpy']
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

  // The current project window, if it has no project and is not
  // opening one.
  #empty () {
    let win = this.wm.current('project')

    if (win == null || this.get(win))
      return null

    for (let pending of this.#pending.values()) {
      if (pending.win === win)
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

  // Whether win is opening path. Renderers may report a new window's
  // project before main knows the window.
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
