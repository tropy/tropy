import assert from 'node:assert'
import { EventEmitter } from 'node:events'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { URL } from 'node:url'
import { get } from './gsettings.js'
import { papersize } from './papersize.js'
import dialog from './dialog.js'
import { debug, error, trace, warn } from '../common/log.js'
import { darwin, linux, win32 } from '../common/os.js'
import { isRightToLeft } from './locale.js'
import { channel } from '../common/release.js'
import { Resource, Icon, View } from './res.js'
import { MIME, SASS } from '../constants/index.js'

import {
  array,
  blank,
  counter,
  omit,
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

// Window READY state { promise, isReady }
const READY = new WeakMap()

export class WindowManager extends EventEmitter {
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
    this.props = new WeakMap()
    this.pending = {}
    this.unloading = new WeakMap()
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

    // Override NoProject size if recent list is empty!
    if (type === 'project' && !args.file && !opts.fixedSize) {
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

      options.backgroundColor =
        BODY[process.platform][args.dark ? 'dark' : 'light']

      switch (process.platform) {
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

      if (fixedSize) {
        this.setFixedSize(win, true, fixedSize)
      }

      let ready = Promise.withResolvers()
      let state = { promise: ready.promise, isReady: false }

      READY.set(win, state)

      win.once('ready', () => ready.resolve())
      win.once('closed', () => ready.reject(new Error('window closed')))

      ready.promise.then(() => { state.isReady = true }, () => {})

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

  handleFocus = (type, win) => {
    if (this._cid !== win.id) {
      this._cid = win.id

      if (this.windows[type][0] !== win) {
        this.windows[type] = [win, ...remove(this.windows[type], win)]
      }

      this.emit('focus-change', type, win)
    }
  }

  handleIpcMessage = async (event, type, ...args) => {
    trace({ args }, `ipc.${type} received`)
    let win = BrowserWindow.fromWebContents(event.sender)

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
      case 'preview':
        win.previewFile(...args)
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

  handleUnload (win, action) {
    if (!this.unloading.has(win)) {
      this.unloading.set(win, action)
      debug(`will ${action} ${this.types.get(win)} window`)
      win.webContents.send('unload')
    }
  }

  handleUnloaded (win) {
    let state = this.unloading.get(win)
    let type = this.types.get(win)

    this.cancel(win, 'unloaded')

    if (state === 'close') {
      debug(`${type} window unloaded, will close`)
      this.unloading.set(win, 'done')
      win.close()
    } else if (state === 'reload') {
      debug(`${type} window unloaded, will reload`)
      this.unloading.delete(win)
      win.reload()
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

    if (this.app.state.frameless && win32) {
      this.each(win => {
        win.setTitleBarOverlay(getTitleBarOverlay())
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

          if (this.unloading.has(win)) {
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

          if (this.unloading.has(win)) {
            warn(`${type}[${win.id}] crashed during unload, forcing destroy`)
            win.destroy()
          }
        })

      win
        .on('show', () => {
          this.emit('show', type, win)
        })
        .on('close', (event) => {
          if (this.unloading.get(win) === 'done') {
            debug(`closing ${type} window`)
          } else {
            event.preventDefault()
            this.handleUnload(win, 'close')
          }
          this.emit('close', type, win)
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

  sendEach (type, ...args) {
    this.each(type, win => this.send(win, ...args))
  }

  dispatch (win, action) {
    this.send(win, 'dispatch', action)
  }

  // Send sync to window (preserving order!) or when ready.
  send (win, ...args) {
    this.whenReady(win, () => {
      if (!win.isDestroyed())
        win.webContents.send(...args)
    })
  }

  isReady (win) {
    return READY.get(win)?.isReady ?? false
  }

  ready (win) {
    return READY.get(win)?.promise ??
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
          reject(Object.assign(new Error(`no response after ${timeout}ms`), {
            code: 'ETIMEDOUT'
          }))
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
        reject(Object.assign(new Error(`window ${reason}`), {
          code: 'ECANCELED'
        }))
    }
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

    this.props.set(win, {
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
    } = this.props.get(win) || WindowManager.defaults[type]

    win.setResizable(true)
    win.setContentSize(width, height, animate)
    win.setMinimumSize(minWidth, minHeight)
    win.setMaximizable(maximizable)
    win.setFullScreenable(fullscreenable)

    if (win.isMinimized())
      win.restore()

    this.props.set(win, {
      isFixedSize: false
    })
  }

  async setFixedSize (win, fixedSize = false, {
    width,
    height,
    animate = true
  } = {}) {
    let { isFixedSize = false } = this.props.get(win) || {}

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

  setTitle (type, title) {
    this.each(type, win => win.setTitle(title))
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
    this.windows[type] = remove(array(this.windows[type]), win)
    this.types.delete(win)
    this.props.delete(win)
    this.unloading.delete(win)
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
      empty: { width: 440, height: 580 }
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
