import assert from 'node:assert'
import { EventEmitter } from 'node:events'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { platform } from 'node:process'
import { URL } from 'node:url'
import { get } from './gsettings.js'
import { papersize } from './papersize.js'
import dialog from './dialog.js'
import { debug, error, trace, warn } from '../common/log.js'
import { darwin, linux, win32 } from '../common/os.js'
import { CodeError } from '../common/error.js'
import { isRightToLeft } from './locale.js'
import { channel } from '../common/release.js'
import { Resource, Icon, View } from './res.js'
import { MIME, SASS } from '../constants/index.js'

import {
  array,
  blank,
  counter,
  omit,
  promote,
  remove,
  restrict,
  when
} from '../common/util.js'

import {
  app,
  BrowserWindow,
  clipboard,
  ClipboardItem,
  ipcMain as ipc,
  nativeTheme,
  screen,
  systemPreferences as prefs
} from 'electron'

const { BODY, PANEL, ESPER } = SASS

// The id to save window geometry under:
// the window type for true, type:id for an id, none for null.
const persistenceId = (type, id) =>
  (id === true) ? type : (id ? `${type}:${id}` : null)

export class WindowManager extends EventEmitter {
  #focusedWindow = null

  constructor (app, defaults = {}) {
    super()

    this.app = app

    this.defaults = {
      disableAutoHideCursor: darwin,
      resizable: true,
      useContentSize: true,
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        preload: join(Resource.base, 'lib/bootstrap.mjs'),
        defaultEncoding: 'UTF-8',
        enableRemoteModule: false,
        experimentalFeatures: false,
        scrollBounce: true,
        spellcheck: false,
        v8CacheOptions: 'bypassHeatCheck',
        ...defaults
      }
    }

    this.windows = {}
    this.types = new WeakMap()
    // Additional state the WM keeps per window: readiness, unloading,
    // persistence id, fixed size and the size to return to.
    this.props = new WeakMap()
    this.pending = {}
    this.seq = counter()
  }

  broadcast (...args) {
    this.each(win => this.send(win, ...args))
  }

  center () {
    this.each(win => win.center())
  }

  configure (type, opts = {}, args = {}) {
    let { empty } = WindowManager.defaults[type]
    let defaults = omit(WindowManager.defaults[type], ['empty', 'plugins'])

    let config = {
      ...this.defaults,
      ...defaults,
      ...opts,
      webPreferences: {
        ...this.defaults.webPreferences,
        ...defaults.webPreferences,
        ...opts.webPreferences
      }
    }

    if (type === 'project' && !args.file && opts.fixedSize === undefined) {
      let { width, height } = empty

      config.fixedSize = {
        width: width * (args.recent?.length ? 2 : 1),
        height,
        animate: false
      }
    }

    return config
  }

  create (type, args = {}, opts) {
    let NOW = Date.now()

    try {
      let {
        fixedSize,
        isExclusive,
        persistence,
        quicklook,
        show,
        ...options
      } = this.configure(type, opts, args)

      if (args.zoom) {
        if (!options.resizable) {
          options.width = Math.round(options.width * args.zoom)
          options.height = Math.round(options.height * args.zoom)
        }

        for (let dim of ['minWidth', 'minHeight']) {
          if (options[dim]) options[dim] = Math.round(options[dim] * args.zoom)
        }
      }

      if (args.frameless && type !== 'print') {
        options.frame = false
      } else {
        options.frame = !args.frameless
      }

      options.backgroundColor = getBackgroundColor(args.dark)

      switch (platform) {
        case 'linux':
          options.icon = Icon.expand(channel, 'tropy', '512x512.png')
          options.darkTheme = options.darkTheme || args.dark
          options.vibrancy = false
          break
        case 'darwin':
          options.title = ''
          options.titleBarStyle = options.titleBarStyle || 'hidden'
          options.trafficLightPosition = getWindowButtonPosition(type)

          if (options.vibrancy && args.vibrancy) {
            options.backgroundColor = '#00000000'
          } else {
            options.vibrancy = false
          }

          break
        case 'win32':
          if (!options.frame) {
            options.titleBarStyle = 'hidden'
            options.titleBarOverlay = getTitleBarOverlay()
          }
          options.vibrancy = false
          break
      }

      let { parent } = options
      options.show = (show === true)

      if (parent != null && !options.modal) {
        let { x, y, width, height } = parent.getBounds()
        options.x = Math.floor((x + width / 2) - options.width / 2)
        options.y = Math.floor((y + height / 2) - options.height / 2)
      }

      var win = new BrowserWindow(sanitizeWindowBounds(options))
      this.setProps(win, { persistenceId: persistenceId(type, persistence) })
      this.restore(win)

      if (fixedSize) {
        this.setFixedSize(win, true, fixedSize)
      }

      if (quicklook) {
        this.enableQuickLook(win)
      }

      this.resetReadyState(win)
      win.once('closed', () => {
        this.getProps(win).ready.reject(new Error('window closed'))
      })

      win.webContents.once('did-finish-load', async () => {
        try {
          win.webContents.zoomFactor = this.app.state.zoom || 1
          await win.webContents.setVisualZoomLevelLimits(1, 1)
        } catch (err) {
          if (!win.isDestroyed()) throw err
        }
      })

      if (isExclusive) {
        win
          .once('show', () => {
            this.each(w => {
              if (w !== win) w.setEnabled(false)
            })
          })
          .once('closed', () => {
            this.each(w => {
              if (w !== win) w.setEnabled(true)
            })
          })
      }

      if (typeof show === 'string') {
        win.once(show, () => {
          win.show()
          debug(`show ${type} win after ${Date.now() - NOW}ms`)
        })
      }

      this.register(type, win)
      this.emit('create', type, win)

      return win

    } catch (err) {
      if (win != null) win.destroy()
      throw err
    }
  }

  close (type, destroy = false) {
    return Promise.all(this.map(type, win =>
      new Promise((resolve) => {
        if (win.isDestroyed())
          return resolve()

        let wc = win.webContents

        if (wc && !(wc.isDestroyed() || wc.isCrashed())) {
          win.once('closed', resolve)
          win[destroy ? 'destroy' : 'close']()
        } else {
          win.destroy()
          resolve()
        }
      })
    ))
  }

  current (type = 'project') {
    return this.windows[type]?.[0]
  }

  get focusedWindow () {
    return this.#focusedWindow ?? this.current()
  }

  each (...args) {
    return this.map(...args), this
  }

  get empty () {
    for (let type in this.windows) {
      if (!blank(this.windows[type])) return false
    }
    return true
  }

  first (type) {
    return this.values(type).next().value
  }

  has (type) {
    return array(type).some(t => !blank(this.windows[t]))
  }

  is (win, type) {
    return this.windows[type]?.includes(win)
  }

  // Get window that sent event (if matches type)
  fromEvent (event, type) {
    let win = BrowserWindow.fromWebContents(event.sender)
    let t = this.types.get(win)

    return (t != null && (type == null || t === type)) ? win : null
  }

  setTitle (win, title, path) {
    win.setTitle(
      title ?? WindowManager.defaults[this.types.get(win)].title ?? '')

    if (darwin && !this.app.state.frameless)
      win.setRepresentedFilename(path ?? '')
  }

  handleFocus = (type, win) => {
    if (this.#focusedWindow !== win) {
      this.#focusedWindow = win

      if (this.windows[type][0] !== win) {
        this.windows[type] = promote(this.windows[type], win)
      }

      this.emit('focus-change', type, win)
    }
  }

  handleIpcMessage = async (event, type, ...args) => {
    trace({ args }, `ipc.${type} received`)
    let win = this.fromEvent(event)

    if (win == null)
      return

    if (type === 'titlebar-action')
      type = await WindowManager.getTitlebarActionFor(args.shift())

    switch (type) {
      case 'close':
        win.close()
        break
      case 'reload':
        this.handleUnload(win, 'reload')
        break
      case 'show':
        win.show()
        break
      case 'undo':
        win.webContents.undo()
        break
      case 'redo':
        win.webContents.redo()
        break
      case 'dialog':
        this.handleShowDialog(win, ...args)
        break
      case 'toggle-maximize':
      case 'maximize':
        if (win.isMaximized())
          win.unmaximize()
        else
          win.maximize()
        break
      case 'toggle-minimize':
      case 'minimize':
        if (win.isMinimized())
          win.restore()
        else
          win.minimize()
        break
      case 'toggle-fullscreen':
      case 'fullscreen':
        win.setFullScreen(!win.isFullScreen())
        break
      case 'fixed-size':
        this.setFixedSize(win, ...args)
        break
      case 'clipboard':
        this.handleClipboard(...args)
        break
      case 'unloaded':
        this.handleUnloaded(win)
        break
      case 'rsvp':
        this.handlePendingResponse(...args)
        break
      case 'show-menu':
        this.emit('show-menu', win, ...args)
        break
      case 'raise':
        win.moveTop()
        break
      default:
        win.emit(type, ...args)
    }
  }

  enableQuickLook (win) {
    win.webContents.setWindowOpenHandler(({ url, frameName }) => {
      if (url !== 'about:blank' || frameName !== 'quicklook') {
        warn(`prevented loading ${url}`)
        return { action: 'deny' }
      }

      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          ...WindowManager.defaults.quicklook,
          backgroundColor: getBackgroundColor(),
          titleBarOverlay: getTitleBarOverlay(),
          trafficLightPosition: getWindowButtonPosition('quicklook'),
          parent: win,
          show: false
        }
      }
    })

    win.webContents.on('did-create-window', (child) => {
      this.setProps(win, { quicklook: child })

      // Child windows close with their parent, but survive its destruction.
      win.once('closed', () => {
        if (!child.isDestroyed()) child.destroy()
      })

      child.webContents.on('will-navigate', handleWillNavigate)

      child
        .on('close', (event) => {
          // Hides instead, unless the parent is closing or crashed.
          if (this.getProps(win).unloading !== 'done' &&
            !win.webContents.isCrashed()) {
            event.preventDefault()
            child.hide()
          }
        })
        .on('show', () => this.send(win, 'quicklook', { isVisible: true }))
        .on('hide', () => this.send(win, 'quicklook', { isVisible: false }))
        .once('closed', () => {
          if (!win.isDestroyed()) {
            this.setProps(win, { quicklook: null })
            this.send(win, 'quicklook', { isVisible: false })
          }
        })
    })
  }

  // Replies once done, so the renderer can swap content
  // in sync with the new bounds.
  handleQuickLook = (event, action, size) => {
    let win = this.fromEvent(event)
    let child = (win == null) ? null : this.getProps(win).quicklook

    if (child == null || child.isDestroyed())
      return

    switch (action) {
      case 'fit':
      case 'show':
        if (!(size?.width > 0 && size?.height > 0))
          return

        fitQuickLook(child, win, size)

        if (action === 'show')
          child.showInactive()
        break
      case 'hide':
        child.hide()
        break
    }
  }

  handleUnload (win, action) {
    if (this.getProps(win).unloading == null) {
      this.setProps(win, { unloading: action })
      debug(`will ${action} ${this.types.get(win)} window`)
      win.webContents.send('unload')
    }
  }

  handleUnloaded (win) {
    let state = this.getProps(win).unloading
    let type = this.types.get(win)

    this.cancel(win, 'unloaded')

    if (state === 'close') {
      debug(`${type} window unloaded, will close`)
      this.setProps(win, { unloading: 'done' })
      win.close()
    } else if (state === 'reload') {
      debug(`${type} window unloaded, will reload`)
      this.setProps(win, { unloading: null })

      if (this.isReady(win))
        this.resetReadyState(win)

      this.getProps(win).quicklook?.hide()
      win.reload()
      this.emit('reload', type, win)
    }
  }

  async handleClipboard (method, data) {
    try {
      switch (method) {
        case 'write': {
          let item = {}

          if (data.text != null)
            item[MIME.TEXT] = data.text
          if (data.html != null)
            item[MIME.HTML] = data.html
          if (data.image != null)
            item[data.type] = new Blob([data.image], { type: data.type })

          await clipboard.write([new ClipboardItem(item)])
          break
        }
      }
    } catch (err) {
      warn({ err }, `failed to ${method} clipboard`)
    }
  }

  handlePendingResponse (action) {
    try {
      var id = action.meta.rsvp

      // Ignore late responses after a timeout or cancel.
      if (!(id in this.pending))
        return

      if (action.error)
        this.pending[id].reject(action.payload)
      else
        this.pending[id].resolve(action)

    } catch (err) {
      warn({ err }, `failed to resolve pending message ${id}`)
    }
  }

  handleScrollBarsChange = () => {
    this.broadcast('scrollbars', !WindowManager.hasOverlayScrollBars())
  }

  get args () {
    let { env, opts, state } = this.app

    return {
      ...env,
      fontSize: state.fontSize,
      frameless: state.frameless,
      locale: state.locale,
      rendererPreference: opts.rendererPreference || state.rendererPreference,
      rtl: isRightToLeft(),
      theme: state.theme,
      zoom: state.zoom
    }
  }

  handleNativeThemeUpdated = () => {
    let theme = nativeTheme.themeSource
    debug(`switch to "${theme}" theme`)

    this.app.state.theme = theme

    this.broadcast('theme', theme, {
      dark: nativeTheme.shouldUseDarkColors,
      contrast: nativeTheme.shouldUseHighContrastColors,
      vibrancy: false // !nativeTheme.prefersReducedTransparency
    })

    if (!darwin) {
      let overlay = getTitleBarOverlay()

      this.each(win => {
        if (win32 && this.app.state.frameless)
          win.setTitleBarOverlay(overlay)

        let { quicklook } = this.getProps(win)
        if (quicklook != null && !quicklook.isDestroyed())
          quicklook.setTitleBarOverlay(overlay)
      })
    }

    this.emit('theme', theme)
  }

  handleSwitchTheme = (_, theme) => {
    nativeTheme.themeSource = theme
  }

  handleChangeFontSize = (_, fontSize) => {
    this.app.state.fontSize = fontSize
    this.broadcast('fontSize', fontSize)
  }

  handleToggleFrameless = (_, frameless) => {
    let { state } = this.app
    state.frameless = (frameless == null) ? !state.frameless : frameless
  }

  handleZoomIn = () => {
    this.zoom(this.app.state.zoom + 0.25)
  }

  handleZoomOut = () => {
    this.zoom(this.app.state.zoom - 0.25)
  }

  handleZoomReset = () => {
    this.zoom(1)
  }

  async handleShowDialog (win, { id, type, options }) {
    dialog
      .show(type, win, options)
      .then(payload => {
        win.webContents.send('dialog', { id, payload })
      })
      .catch(({ message }) => {
        win.webContents.send('dialog', {
          error: true,
          id,
          payload: { message }
        })
      })
  }

  map (type, fn) {
    if (typeof type === 'function') {
      fn = type
      type = undefined
    }

    return Array.from(this.values(type), fn)
  }

  open (type, args, opts = {}) {
    let props = {
      app: Resource.base,
      documents: getPath('documents', 'home'),
      pictures: getPath('pictures', 'home'),
      theme: 'light',
      aqua: WindowManager.getAquaColorVariant(),
      contrast: nativeTheme.shouldUseHighContrastColors,
      dark: nativeTheme.shouldUseDarkColors,
      scrollbars: !WindowManager.hasOverlayScrollBars(),
      // TODO re-enable vibrancy effect when sidebar scrolling
      // performance fixed (or new tag widget has landed)
      vibrancy: false, // !nativeTheme.prefersReducedTransparency,
      motion: !WindowManager.preferReducedMotion(),
      ...this.args,
      ...args
    }

    if (WindowManager.defaults[type].plugins === false)
      props.plugins = null

    let win = this.create(type, props, opts)
    loadView(win, type, props)

    return win
  }

  register (type, win) {
    try {
      win
        .on('app-command', handleAppCommand)
        .on('focus', () => this.handleFocus(type, win))
        .on('page-title-updated', (event) => {
          event.preventDefault()
        })
        .on('unresponsive', () => {
          warn(`${type}[${win.id}] has become unresponsive`)
          this.emit('unresponsive', type, win)

          if (this.getProps(win).unloading != null) {
            warn(`${type}[${win.id}] unresponsive during unload, forcing destroy`)
            win.destroy()
          }
        })

      webContentsForward(win, [
        'focus',
        'blur',
        'maximize',
        'unmaximize',
        'enter-full-screen',
        'leave-full-screen',
        'show'
      ])

      win.webContents
        .on('devtools-reload-page', (event) => {
          event.preventDefault()
          this.handleUnload(win, 'reload')
        })
        .on('will-navigate', handleWillNavigate)
        .on('render-process-gone', (_, details) => {
          if (details?.reason !== 'clean-exit') {
            warn({
              details
            }, `${type}[${win.id}] render-process crashed: ${details?.reason}`)
            this.emit('crashed', type, win)
          }

          this.cancel(win, 'crashed')

          // Quicklook shares the renderer process.
          let { quicklook } = this.getProps(win)
          if (quicklook != null && !quicklook.isDestroyed())
            quicklook.hide()

          if (this.getProps(win).unloading != null) {
            warn(`${type}[${win.id}] crashed during unload, forcing destroy`)
            win.destroy()
          }
        })

      win
        .on('show', () => {
          this.emit('show', type, win)
        })
        .on('maximize', () => this.persist(win, { bounds: true }))
        .on('enter-full-screen', () => this.persist(win, { bounds: true }))
        .on('unmaximize', () => this.restore(win))
        .on('leave-full-screen', () => this.restore(win))
        .on('close', (event) => {
          this.persist(win)

          if (this.getProps(win).unloading === 'done') {
            debug(`closing ${type} window`)
            this.emit('close', type, win)
          } else {
            event.preventDefault()
            this.handleUnload(win, 'close')
          }
        })
        .once('closed', () => {
          this.cancel(win, 'closed')
          this.unref(type, win)
          this.emit('closed', type, win)
        })

      this.windows[type] = [win, ...array(this.windows[type])]
      this.types.set(win, type)

    } catch (err) {
      this.unref(type, win)
      throw err
    }
  }

  // Changes a window's persistence id mid-flight:
  // persists current, restores new one.
  setPersistenceId (win, id) {
    let type = this.types.get(win)

    if (type == null)
      return

    id = persistenceId(type, id)

    if (this.getProps(win).persistenceId === id)
      return

    this.persist(win)
    this.setProps(win, { persistenceId: id })
    this.restore(win)
  }

  prune (type, ids = []) {
    let keep = new Set(ids.map(id => persistenceId(type, id)))
    let saved = this.app.state.win

    for (let key of Object.keys(saved)) {
      if (key.startsWith(`${type}:`) && !keep.has(key))
        delete saved[key]
    }
  }

  // Saves current bounds and maximized state to app.state.
  // Bounds are saved when the window is normal
  // or just after entering full-sreen or maximized state.
  persist (win, { bounds = win.isNormal() } = {}) {
    let { persistenceId: id, isFixedSize } = this.getProps(win)

    if (id == null || isFixedSize || win.isDestroyed())
      return

    let saved = this.app.state.win

    saved[id] = {
      ...((bounds || saved[id] == null) ? win.getNormalBounds() : saved[id]),
      isMaximized: win.isMaximized()
    }
  }

  restore (win) {
    let { persistenceId: id, isFixedSize } = this.getProps(win)
    let saved = (id == null) ? null : this.app.state.win[id]

    if (saved == null)
      return

    let { x, y, width, height, isMaximized } = saved

    if (isFixedSize) {
      // The size to return to is a content size.
      let [cw, ch] = win.getContentSize()
      let bounds = win.getBounds()

      this.setProps(win, {
        width: width - (bounds.width - cw),
        height: height - (bounds.height - ch)
      })

    } else if (!win.isVisible()) {
      win.setBounds(sanitizeWindowBounds({ x, y, width, height }))

      if (isMaximized)
        win.once('show', () => win.maximize())

    } else if (win.isNormal()) {
      win.setBounds(sanitizeWindowBounds({ ...win.getBounds(), width, height }))
    }
  }

  sendEach (type, ...args) {
    this.each(type, win => this.send(win, ...args))
  }

  dispatch (win, action) {
    this.send(win, 'dispatch', action)
  }

  // Send sync to window (preserving order!) or when ready.
  send (win, ...args) {
    this.whenReady(win, () => {
      // Closing windows may already have lost their web contents.
      if (!win.isDestroyed() && !win.webContents.isDestroyed())
        win.webContents.send(...args)
    })
  }

  isReady (win) {
    return this.getProps(win).ready?.isReady ?? false
  }

  ready (win) {
    return this.getProps(win).ready?.promise ??
      Promise.reject(new Error('unknown window'))
  }

  // Calls resolve right away if the window is ready,
  // otherwise once it is ready (or reject if it closes before).
  whenReady (win, resolve, reject = () => {}) {
    if (this.isReady(win))
      resolve()
    else
      this.ready(win).then(resolve, reject)
  }

  // Waits for the renderer of win to report ready,
  // when created and again after each reload.
  resetReadyState (win) {
    let { promise, resolve, reject } = Promise.withResolvers()
    let ready = { promise, reject, isReady: false }

    this.setProps(win, { ready })
    win.once('ready', resolve)
    promise.then(() => { ready.isReady = true }, () => {})
  }

  rsvp (win, action, { timeout = 60000 } = {}) {
    let id
    let timer

    return new Promise((resolve, reject) => {
      id = this.seq.next().value

      if (win == null)
        return reject(new Error('window not found'))

      action.meta.rsvp = id
      this.pending[id] = { win, resolve, reject }

      this.dispatch(win, action)

      if (timeout > 0)
        timer = setTimeout(() => {
          reject(new CodeError('ETIMEDOUT', `no response after ${timeout}ms`))
        }, timeout)

    }).finally(() => {
      clearTimeout(timer)
      delete this.pending[id]
    })
  }

  // Rejects all pending responses from the window:
  // they will never arrive once it unloads, crashes or closes.
  cancel (win, reason) {
    for (let { win: w, reject } of Object.values(this.pending)) {
      if (w === win)
        reject(new CodeError('ECANCELED', `window ${reason}`))
    }
  }

  // The additional state the WM keeps for win.
  getProps (win) {
    return this.props.get(win) ?? {}
  }

  // Merges props into the additional state the WM keeps for win.
  setProps (win, props) {
    this.props.set(win, { ...this.props.get(win), ...props })
  }

  async enterFixedSize (win) {
    if (!win.isNormal())
      await WindowManager.setNormal(win)

    let [width, height] = win.getContentSize()
    let [minWidth, minHeight] = win.getMinimumSize()
    let maximizable = win.isMaximizable()
    let fullscreenable = win.isFullScreenable()

    win.setMinimumSize(16, 16)
    win.setMaximizable(false)
    win.setFullScreenable(false)
    win.setResizable(false)

    this.setProps(win, {
      isFixedSize: true,
      width,
      height,
      minWidth,
      minHeight,
      maximizable,
      fullscreenable
    })
  }

  leaveFixedSize (win, animate) {
    let type = this.types.get(win)

    let {
      width,
      height,
      minWidth = 16,
      minHeight = 16,
      maximizable,
      fullscreenable = true
    } = { ...WindowManager.defaults[type], ...this.getProps(win) }

    win.setResizable(true)
    win.setContentSize(width, height, animate)
    win.setMinimumSize(minWidth, minHeight)
    win.setMaximizable(maximizable)
    win.setFullScreenable(fullscreenable)

    if (win.isMinimized())
      win.restore()

    this.setProps(win, { isFixedSize: false })
  }

  async setFixedSize (win, fixedSize = false, {
    width,
    height,
    animate = true
  } = {}) {
    let { isFixedSize = false } = this.getProps(win)

    try {
      if (fixedSize) {
        if (!isFixedSize)
          await this.enterFixedSize(win)

        if (width || height) {
          try {
            let size = win.getContentSize()
            win.setResizable(true)
            win.setContentSize(width || size[0], height || size[1], animate)
          } finally {
            win.setResizable(false)
          }
        }

      } else {
        if (isFixedSize)
          this.leaveFixedSize(win, animate)
      }
    } catch (err) {
      if (!win.isDestroyed()) throw err
    }
  }

  async show (type, args, opts) {
    let win = this.current(type)
    if (win) {
      win.show()
    } else {
      // Shown on init, which comes before ready.
      win = this.open(type, args, { show: 'init', ...opts })
      await this.ready(win)
    }
    return win
  }

  async start () {
    ipc.on('wm', this.handleIpcMessage)
    ipc.handle('quicklook', this.handleQuickLook)

    // The restored theme, before listening to changes.
    nativeTheme.themeSource = this.app.state.theme
    nativeTheme.on('updated', this.handleNativeThemeUpdated)

    this.app
      .on('app:switch-theme', this.handleSwitchTheme)
      .on('app:change-font-size', this.handleChangeFontSize)
      .on('app:toggle-frameless-flag', this.handleToggleFrameless)
      .on('app:zoom-in', this.handleZoomIn)
      .on('app:zoom-out', this.handleZoomOut)
      .on('app:zoom-reset', this.handleZoomReset)
  }

  async stop (destroy = false) {
    await this.close(undefined, destroy)
    ipc.removeListener('wm', this.handleIpcMessage)
    ipc.removeHandler('quicklook')

    nativeTheme.off('updated', this.handleNativeThemeUpdated)

    this.app
      .off('app:switch-theme', this.handleSwitchTheme)
      .off('app:change-font-size', this.handleChangeFontSize)
      .off('app:toggle-frameless-flag', this.handleToggleFrameless)
      .off('app:zoom-in', this.handleZoomIn)
      .off('app:zoom-out', this.handleZoomOut)
      .off('app:zoom-reset', this.handleZoomReset)
  }

  unref (type, win) {
    if (this.#focusedWindow === win)
      this.#focusedWindow = null

    this.windows[type] = remove(array(this.windows[type]), win)
    this.types.delete(win)
    this.props.delete(win)
  }

  zoom (factor) {
    factor = restrict(factor, this.MIN_ZOOM, this.MAX_ZOOM)
    this.app.state.zoom = factor

    for (let win of this.values()) {
      let old = win.webContents.zoomFactor
      if (old === factor) continue

      win.webContents.zoomFactor = factor

      if (win.isResizable()) {
        let [minWidth, minHeight] = win.getMinimumSize()

        minWidth = Math.round((minWidth / old) * factor)
        minHeight = Math.round((minHeight / old) * factor)
        win.setMinimumSize(minWidth, minHeight)

      } else {
        let [width, height] = win.getContentSize()
        win.setContentSize(
          Math.round((width / old) * factor),
          Math.round((height / old) * factor))
      }

      this.send(win, 'zoom', factor)
    }

    return factor
  }

  *values (type = Object.keys(this.windows)) {
    for (let t of array(type)) {
      if (t in this.windows)
        yield * this.windows[t].values()
    }
  }

  *[Symbol.iterator] () {
    yield * this.values()
  }

  static defaults = {
    about: {
      width: 600,
      height: 318,
      autoHideMenuBar: true,
      fullscreenable: false,
      maximizable: false,
      minimizable: false,
      resizable: false
    },
    prefs: {
      width: 800,
      height: 580,
      autoHideMenuBar: true,
      fullscreenable: false,
      maximizable: false,
      minimizable: false,
      resizable: false
    },
    print: {
      width: 600,
      height: 300,
      plugins: false
    },
    project: {
      title: 'Tropy',
      width: 1280,
      height: 720,
      minWidth: PANEL.MIN_WIDTH + ESPER.MIN_WIDTH * 2,
      minHeight: PANEL.MIN_HEIGHT * 3 + PANEL.TOOLBAR + PANEL.HEADER_MARGIN,
      vibrancy: 'sidebar',
      // Without a project; twice as wide with recent projects.
      empty: { width: 440, height: 580 },
      quicklook: true
    },
    quicklook: {
      width: 640,
      height: 480,
      titleBarStyle: 'hidden',
      focusable: false,
      fullscreenable: false,
      maximizable: false,
      minimizable: false,
      skipTaskbar: true,
      type: darwin ? 'panel' : undefined
    }
  }

  MIN_ZOOM = 0.75
  MAX_ZOOM = 2

  static getAquaColorVariant () {
    return darwin && AQUA[
      prefs.getUserDefault('AppleAquaColorVariant', 'string')
    ]
  }

  static hasOverlayScrollBars () {
    return darwin &&
      prefs.getUserDefault('AppleShowScrollBars', 'string') === 'WhenScrolling'
  }

  static async getTitlebarActionFor (trigger) {
    try {
      if (darwin) {
        if (trigger === 'double-click')
          return prefs
            .getUserDefault('AppleActionOnDoubleClick', 'string')
            .toLowerCase()
      }

      if (linux) {
        return await get(
          `org.gnome.desktop.wm.preferences.action-${trigger}-titlebar`
        )
      }
    } catch (err) {
      warn({ err }, `failed to resolve titlebar action for ${trigger}`)
    }

    if (trigger === 'double-click')
      return 'maximize'
    else
      return 'raise'
  }

  static async getButtonLayout () {
    try {
      return !linux ? null :
        await get('org.gnome.desktop.wm.preferences', 'button-layout')
    } catch (err) {
      warn({ err }, 'failed to get GNOME button-layout')
      return null
    }
  }

  static print (win, {
    usePrinterDefaultPageSize = true,
    ...opts
  } = {}) {
    return new Promise((resolve, reject) => {
      win.webContents.print({
        usePrinterDefaultPageSize,
        ...opts
      }, (success, reason) => {
        if (success)
          resolve('successful')
        else
          (/cancell?ed/i).test(reason) ? resolve(reason) : reject(reason)
      })
    })
  }

  static async printToPDF (win, path, { pageSize, landscape = false } = {}) {
    assert(path?.length > 0, 'missing PDF output file')

    if (!pageSize)
      pageSize = await papersize()

    let data = await win.webContents.printToPDF({
      pageSize,
      landscape
    })

    await writeFile(path, data)

    return path
  }

  static preferReducedMotion () {
    try {
      return prefs.getAnimationSettings().prefersReducedMotion

    } catch (err) {
      warn({ err }, 'failed to check reduced motion preference')
      return false
    }
  }

  static async leaveFullScreen (win) {
    await setWindowState(win, 'leave-full-screen', 'setFullScreen', false)
  }

  static async unmaximize (win) {
    await setWindowState(win, 'unmaximize')
  }

  static async restore (win) {
    await setWindowState(win, 'restore')
  }

  static async setNormal (win) {
    if (win.isMinimized())
      await WindowManager.restore(win)
    // Subtle: macOS reports isMaximized when in full-screen,
    // so we need to check isFullScreen first!
    if (win.isFullScreen())
      await WindowManager.leaveFullScreen(win)
    if (win.isMaximized())
      await WindowManager.unmaximize(win)
  }
}


const getWindowButtonPosition = (type) => {
  switch (type) {
    case 'prefs':
      return { x: 12, y: 11 }
    default:
      return { x: 12, y: 11 }
  }
}

const getTitleBarOverlay = () => ({
  height: 33, // 32px
  color: '#ffffff00',
  symbolColor: nativeTheme.shouldUseDarkColors ? '#bbbbbb' : '#222222'
})

const AQUA = { 1: 'blue', 6: 'graphite' }

const APP_CMD = {
  'browser-backward': 'back',
  'browser-forward': 'forward'
}

function handleAppCommand (_, name) {
  if (name in APP_CMD)
    this.webContents.send(`global:${APP_CMD[name]}`)
}

function handleWillNavigate (event, url) {
  try {
    let current = new URL(this.getURL())
    let next = new URL(url)

    if (current.pathname !== next.pathname) {
      warn(`win#${this.id} attempted to navigate to ${url}`)
      event.preventDefault()
    }
  } catch (err) {
    event.preventDefault()
    error(err)
  }
}

async function loadView (win, type, props) {
  try {
    if (linux)
      props.controls = await WindowManager.getButtonLayout()

    // On Linux minimizable/maximizable is always true,
    // so we use our default config instead.
    let mmx = linux ? WindowManager.defaults[type] : win

    await win.loadFile(View.expand(type), {
      hash: encodeURIComponent(JSON.stringify({
        ...props,
        maximizable: mmx.maximizable !== false,
        minimizable: mmx.minimizable !== false
      }))
    })
  } catch (err) {
    if (win.isDestroyed())
      return

    warn({ err }, `failed to load ${type} window`)
    win.destroy()
  }
}

function webContentsForward (win, events) {
  for (let type of events) {
    win.on(type, () => { win.webContents.send('win', type) })
  }
}

function getBackgroundColor (dark = nativeTheme.shouldUseDarkColors) {
  return BODY[platform][dark ? 'dark' : 'light']
}

function fitQuickLook (win, parent, { width, height }) {
  let display = screen.getDisplayMatching(parent.getBounds())
  let { workArea } = display

  let anchor = (win.isVisible() &&
    screen.getDisplayMatching(win.getBounds()).id === display.id) ?
    win.getBounds() :
    workArea

  // Small photos are scaled up to a usable size.
  let scale = Math.min(
    Math.max(1, 200 / Math.min(width, height)),
    0.9 * workArea.width / width,
    0.95 * workArea.height / height)

  win.setAspectRatio(width / height)

  width = Math.round(width * scale)
  height = Math.round(height * scale)

  win.setBounds(sanitizeWindowBounds({
    x: Math.round(anchor.x + (anchor.width - width) / 2),
    y: Math.round(anchor.y + (anchor.height - height) / 2),
    width,
    height
  }))
}

export function sanitizeWindowBounds (opts = {}, display) {
  display ??= (opts.x != null && opts.y != null)
    ? screen.getDisplayMatching(opts)
    : screen.getPrimaryDisplay()

  let { x, y, width, height } = display.workArea

  if (opts.width > width) opts.width = width
  if (opts.height > height) opts.height = height

  if (opts.x != null)
    opts.x = restrict(opts.x, x, x + width - opts.width)
  if (opts.y != null)
    opts.y = restrict(opts.y, y, y + height - opts.height)

  return opts
}

function setWindowState (win, event, setter = event, ...args) {
  let p = when(win, event, { timeout: 2000 })
  win[setter](...args)
  return p
}

export function getPath (name, fallback) {
  try {
    return app.getPath(name)
  } catch (err) {
    if (fallback) {
      return getPath(name)
    }
    throw err
  }
}
