import fs from 'node:fs'
import { resolve } from 'node:path'
import { app, ipcMain as ipc } from 'electron'
import { CodeError, IpcError } from '../common/error.js'
import { info, warn } from '../common/log.js'
import { darwin, win32 } from '../common/os.js'
import { promote, protocolURL, urlId as getUrlId } from '../common/util.js'
import { PROJECT } from '../constants/index.js'
import dialog from './dialog.js'
import * as act from './actions.js'
import * as shell from './shell.js'

/**
 * ProjectManager manages all known projects,
 * based on the `app.state.recent` list,
 * and tracks open projects and their windows.
 */
export class ProjectManager {
  #projects = new WeakMap()  // win -> project
  #pending = new Map()       // path -> { win, opened }

  constructor (app) {
    this.app = app
  }

  start () {
    ipc
      .on(PROJECT.OPENED, this.handleProjectOpened)
      .on(PROJECT.UPDATE, this.handleProjectUpdated)
      .on(PROJECT.CLOSED, this.handleProjectClosed)

    this.wm
      .on('close', this.handleWindowClose)
      .on('closed', this.handleWindowClosed)
      .on('crashed', this.handleWindowCrashed)
      .on('reload', this.handleWindowReload)
      .on('focus-change', this.handleWindowFocus)

    this.app
      .on('app:create-project', this.handleCreateProject)
      .on('app:open-dialog', this.handleOpenDialog)
      .on('app:open-project', this.handleOpenProject)
      .on('app:switch-project', this.handleSwitchProject)
      .on('app:show-project-file', this.handleShowProjectFile)
      .on('app:clear-recent-projects', this.handleClearRecentProjects)
  }

  stop () {
    ipc
      .off(PROJECT.OPENED, this.handleProjectOpened)
      .off(PROJECT.UPDATE, this.handleProjectUpdated)
      .off(PROJECT.CLOSED, this.handleProjectClosed)

    this.wm
      .off('close', this.handleWindowClose)
      .off('closed', this.handleWindowClosed)
      .off('crashed', this.handleWindowCrashed)
      .off('reload', this.handleWindowReload)
      .off('focus-change', this.handleWindowFocus)

    this.app
      .off('app:create-project', this.handleCreateProject)
      .off('app:open-dialog', this.handleOpenDialog)
      .off('app:open-project', this.handleOpenProject)
      .off('app:switch-project', this.handleSwitchProject)
      .off('app:show-project-file', this.handleShowProjectFile)
      .off('app:clear-recent-projects', this.handleClearRecentProjects)
  }

  get recent () {
    return this.app.state.recent
  }

  get wm () {
    return this.app.wm
  }

  // Returns the project for a given window
  get (win = this.wm.current()) {
    return this.#projects.get(win) ?? null
  }

  // Check if window has a project associated with it
  has (win = this.wm.current()) {
    return this.#projects.has(win)
  }

  // Associates the project with the window
  set (win, project) {
    if (this.get(win)?.path !== project.path)
      this.wm.setPersistenceId(win, getUrlId(project.path))

    this.#projects.set(win, project)
    this.#setTitle(win, project)

    if (win === this.wm.current())
      this.app.menu.handleWindowChange()
  }

  // Removes the window-project mapping
  delete (win) {
    if (!this.#projects.delete(win))
      return false

    this.wm.setPersistenceId(win, null)
    this.wm.setTitle(win)

    if (win === this.wm.current())
      this.app.menu.handleWindowChange()

    return true
  }

  // Reverse lookup to get the window for a project path
  window (path) {
    if (path == null)
      return null
    else
      return this.wm.values('project').find(win =>
        this.get(win)?.path === path
      ) ?? null
  }

  // Finds recent project via urlId (with legacy 'current' fallback)
  // Returned match is either open in a window or exists on disk!
  find (urlId) {
    if (urlId === 'current')
      return this.get(this.wm.current('project'))?.path ?? this.mostRecent()

    let id = encodeURIComponent(urlId.toWellFormed().normalize())
    let matches = this.recent.filter(file => getUrlId(file) === id)

    return matches.find(file => this.window(file) != null) ??
      matches.find(file => fs.existsSync(file)) ?? null
  }

  mostRecent () {
    return this.recent.find(file => fs.existsSync(file)) ?? null
  }

  // Inferred project info (without opening the file)
  describe (path) {
    return {
      urlId: getUrlId(path),
      path,
      open: this.window(path) != null,
      url: protocolURL(path)
    }
  }

  // The recent projects that still exist, most recent first.
  list () {
    return this.recent
      .filter(file => fs.existsSync(file))
      .map(path => this.describe(path))
  }

  // Adds path to the top of recent projects.
  addRecent (path) {
    if (darwin || win32)
      app.addRecentDocument(path)

    this.setRecent(promote(this.recent, path))
  }

  // Removes path, or all, from recent projects (open projects are kept).
  clearRecent (path) {
    let open = new Set(this.wm.values('project').map(win =>
      this.get(win)?.path))

    this.setRecent(this.recent.filter(file =>
      open.has(file) || (path != null && file !== path)))
  }

  setRecent (list, { reloadMenu = true } = {}) {
    this.app.state.recent = list
    this.wm.sendEach('project', 'recent', list)
    this.wm.prune('project', list.map(getUrlId))

    if (reloadMenu)
      this.app.menu.reload()
  }

  // Opening projects

  // Shows and returns the window of the project at path.
  // If the project is not open or opening, opens it in win.
  // Without win, opens it in the current project window if that is empty,
  // otherwise in a new window.
  // Without a path, shows win, the empty current or a new project window.
  // The meta is passed on with the project.open action,
  // e.g. create ({ name }) to create the project first
  // or silent to suppress error dialogs.
  show (path, { win, ...meta } = {}) {
    if (path) {
      // NB: may want canonical paths (realpath) here for case / symlink issues!
      path = resolve(path)

      let open = this.window(path) ?? this.#pending.get(path)?.win

      if (open) {
        info({ path }, 'focus existing project window')
        // Windows still loading show themselves.
        this.wm.whenReady(open, () => open.show())
        return open
      }
    }

    win ??= this.#noProjectWindow()

    if (win == null) {
      info({ path }, 'open project in new window')
      win = this.#openWindow(path, meta)

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

  // Like show, but resolves once the project is open,
  // to the project and its window.
  async open (path, options) {
    let win = this.show(path, options)
    await this.#pending.get(resolve(path))?.opened.promise

    return { win, project: this.get(win) }
  }

  // Resolves a project URL id to the project and its window,
  // opening the project if necessary.
  // Returns null if there is no such project.
  async openByUrlId (urlId, meta) {
    let path = this.find(urlId)
    return path ? this.open(path, meta) : null
  }

  // Lets the user pick a project file; null if cancelled.
  async pick (win = this.wm.current()) {
    let { cancel, value: files } = await dialog.open(win, {
      filters: [{
        name: this.app.dict.dialog.file.project,
        extensions: ['tpy', 'tropy']
      }]
    })

    return cancel ? null : files[0]
  }

  handleProjectOpened = (event, project) => {
    let win = this.wm.fromEvent(event, 'project')

    if (win == null)
      return

    this.set(win, project)

    if (this.#isPending(project.path, win))
      this.#settle(project.path)

    // Prefs show the settings of their parent window's project.
    let prefs = this.wm.first('prefs')
    if (prefs?.getParentWindow() === win) prefs.close()

    if (project.isManaged)
      shell.setProjectFolderIcon(project.path)

    this.app.setHistory(null, win)
    this.addRecent(project.path)
  }

  handleProjectUpdated = (event, project) => {
    let win = this.wm.fromEvent(event, 'project')

    // Only updates of the project the window has open:
    // reports can arrive after it was closed or replaced.
    if (win != null && this.get(win)?.path === project.path)
      this.set(win, project)
  }

  handleProjectClosed = (event, { path, error }) => {
    let win = this.wm.fromEvent(event, 'project')

    if (error)
      warn({ error, path }, `project closed with error: ${error.message}`)

    if (this.#isPending(path, win))
      this.#settle(path, error
        ? new IpcError(error)
        : new CodeError('ECANCELED', 'project open canceled'))

    if (this.get(win)?.path === path)
      this.delete(win)
  }

  // Recent projects follow use: the focused project comes first.
  // Skips the menu reload, which rebuilds the whole app menu.
  handleWindowFocus = (type, win) => {
    let path = this.get(win)?.path

    if (path != null && this.recent[0] !== path)
      this.setRecent(promote(this.recent, path), { reloadMenu: false })
  }

  // Prefs may have changed the settings of their parent window's project,
  // and the vocabularies and settings of all projects.
  handleWindowClose = (type, win) => {
    if (type !== 'prefs')
      return

    let parent = win.getParentWindow()

    if (this.get(parent))
      this.app.dispatch(act.project.reload(), parent)

    this.wm.sendEach('project', 'dispatch',
      act.ontology.load(null, { replace: true }),
      act.storage.reload([['settings']]))
  }

  handleWindowClosed = (type, win) => {
    this.#release(win, 'window closed')
  }

  // Reloaded windows start over: opens in progress are lost.
  handleWindowReload = (type, win) => {
    this.#release(win, 'window reloaded')
  }

  // Crashed windows report nothing: their project is gone.
  handleWindowCrashed = (type, win) => {
    this.#release(win, 'window crashed')
    this.delete(win)
  }

  // Opens a converted or optimized copy in place of the original.
  handleSwitchProject = async (_, { path, old }) => {
    await this.wm.close('prefs')
    this.show(path, { win: this.window(old) })
  }

  handleCreateProject = () => {
    this.show()
  }

  handleOpenDialog = async () => {
    let file = await this.pick()

    if (file)
      this.show(file)
  }

  // Opens a project the renderer asked for in its window,
  // unless the window is opening another project already
  // (e.g. when dropping several projects) or the project
  // is open elsewhere.
  // Other windows (e.g. prefs) do not open projects themselves.
  handleOpenProject = (win, { path, create }) => {
    if (!this.wm.is(win, 'project') || this.#isOpening(win))
      win = null

    this.show(path, { win, create })
  }

  handleLocaleChange = () => {
    for (let win of this.wm.values('project')) {
      let project = this.get(win)
      if (project) this.#setTitle(win, project)
    }
  }

  handleShowProjectFile = (win, { target } = {}) => {
    let path = target?.path ?? this.get(win)?.path
    if (path) shell.show(path)
  }

  handleClearRecentProjects = (_, { target } = {}) => {
    this.clearRecent(target?.path)
  }

  #setTitle (win, project) {
    this.wm.setTitle(win, [
      project.name,
      project.isReadOnly ? this.app.dict.window.project.readOnly : ''
    ].join(''), project.path)
  }

  // The current project window,
  // if it has no project and is not opening one.
  #noProjectWindow () {
    let win = this.wm.current('project')

    if (win == null || this.has(win) || this.#isOpening(win))
      return null

    return win
  }

  // Opens a new project window for path.
  // Using open, not show, to track the new window right away;
  // it shows itself on init.
  #openWindow (path, meta) {
    let args = { recent: this.recent }
    let opts = { show: 'init', persistence: path && getUrlId(path) }

    // Plain opens pass the project as window argument.
    // Otherwise the action carries the meta (e.g. create, silent);
    // without the argument, the window must not start at the
    // fixed size of windows without project.
    if (!Object.values(meta).some(Boolean))
      return this.wm.open('project', { ...args, file: path }, opts)

    let win = this.wm.open('project', args, { ...opts, fixedSize: false })
    this.app.dispatch(act.project.open(path, meta), win)
    return win
  }

  // Tracks opening path in win,
  // until the window reports the project open or closed.
  #track (path, win) {
    let pending = { win, opened: Promise.withResolvers() }

    // Nobody may wait for it, e.g. after show.
    pending.opened.promise.catch(() => {})

    this.#pending.set(path, pending)
  }

  // Whether win is opening any project.
  #isOpening (win) {
    return this.#pending.values().some(pending => pending.win === win)
  }

  // Whether win is opening path.
  #isPending (path, win) {
    return this.#pending.get(path)?.win === win
  }

  // Settles all opens pending in win.
  #release (win, reason) {
    for (let [path, pending] of this.#pending) {
      if (pending.win === win)
        this.#settle(path, new CodeError('ECANCELED', reason))
    }
  }

  #settle (path, error) {
    let pending = this.#pending.get(path)

    if (pending == null)
      return

    this.#pending.delete(path)

    if (error) {
      if (!this.has(pending.win))
        this.wm.setPersistenceId(pending.win, null)

      pending.opened.reject(error)
    } else {
      pending.opened.resolve()
    }
  }
}
