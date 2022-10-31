import assert from 'node:assert'
import { EventEmitter } from 'node:events'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { URL } from 'node:url'
import { read } from './mac-defaults.js'
import { papersize } from './papersize.js'
import dialog from './dialog.js'
import { debug, error, trace, warn } from '../common/log.js'
import { darwin } from '../common/os.js'
import { channel } from '../common/release.js'
import { Resource, Icon, View } from './res.js'
import { SASS } from '../constants/index.js'

import {
  array,
  blank,
  counter,
  remove,
  restrict,
  when
} from '../common/util.js'

import {
  app,
  BrowserWindow,
  ipcMain as ipc,
  nativeTheme,
  systemPreferences as prefs
} from 'electron'

const { BODY, PANEL, ESPER } = SASS

export class WindowManager extends EventEmitter {
  constructor(defaults = {}) {
    super()

    this.defaults = {
      disableAutoHideCursor: darwin,
      resizable: true,
      useContentSize: true,
      show: false,
      webPreferences: {
        contextIsolation: true,
        defaultEncoding: 'UTF-8',
        enableRemoteModule: false,
        nodeIntegration: true,
        preload: join(Resource.base, 'lib/bootstrap.js'),

        // TODO remove once we're on Electron 21 or later!
        // The flag enables CSS :has and container queries.
        experimentalFeatures: true,

        spellcheck: false,
        v8CacheOptions: 'bypassHeatCheck',
        ...defaults
      }
    }

    this.windows = {}
    this.types = new WeakMap()
    this.props = new WeakMap()
    this.pending = {}
    this.seq = counter()
  }

  broadcast(...args) {
    this.each(win => win.webContents.send(...args))
  }

  center() {
    this.each(win => win.center())
  }

  configure(type, opts = {}) {
    return {
      ...this.defaults,
      ...WindowManager.defaults[type],
      ...opts,
      webPreferences: {
        ...this.defaults.webPreferences,
        ...WindowManager.defaults[type].webPreferences,
        ...opts.webPreferences
      }
    }
  }

  // eslint-disable-next-line complexity
  async create(type, args = {}, opts) {
    let NOW = Date.now()

    try {
      opts = this.configure(type, opts)

      if (args.zoom) {
        if (!opts.resizable) {
          opts.width = Math.round(opts.width * args.zoom)
          opts.height = Math.round(opts.height * args.zoom)
        }

        for (let dim of ['minWidth', 'minHeight']) {
          if (opts[dim]) opts[dim] = Math.round(opts[dim] * args.zoom)
        }
      }

      if (args.frameless) {
        opts.frame = false
      }

      opts.backgroundColor =
        BODY[process.platform][args.dark ? 'dark' : 'light']

      switch (process.platform) {
        case 'linux':
          opts.icon = Icon.expand(channel, 'tropy', '512x512.png')
          opts.darkTheme = opts.darkTheme || args.dark
          opts.vibrancy = false
          break
        case 'darwin':
          if (!opts.frame) {
            opts.frame = true
            opts.title = ''
            opts.titleBarStyle = opts.titleBarStyle || 'hidden'
            opts.trafficLightPosition = getTrafficLightPosition(type)
          }

          if (opts.vibrancy && args.vibrancy) {
            opts.backgroundColor = '#00000000'
          } else {
            opts.vibrancy = false
          }

          break
        case 'win32':
          opts.vibrancy = false
          break
      }

      let { show, parent } = opts
      opts.show = (show === true)

      if (parent != null && !opts.modal) {
        let { x, y, width, height } = parent.getBounds()
        opts.x = Math.floor((x + width / 2) - opts.width / 2)
        opts.y = Math.floor((y + height / 2) - opts.height / 2)
      }

      // TODO check position on display!
      var win = new BrowserWindow(opts)

      if (opts.fixedSize) {
        this.setFixedSize(win, true, opts.fixedSize)
      }

      // Manage a promise for our IPC ready event. Handling this here
      // immediately after creation makes it easier to avoid potential
      // race conditions.
      win.ready = new Promise((resolve) => {
        win.once('ready', () => {
          resolve(Date.now())
        })
      })

      win.webContents.once('did-finish-load', async () => {
        win.webContents.zoomFactor = args.zoom || 1
        await win.webContents.setVisualZoomLevelLimits(1, 1)
      })

      if (opts.isExclusive) {
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

    } catch (e) {
      if (win != null) win.destroy()
      throw e
    }
  }

  close(type, destroy = false) {
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

  current(type = 'project') {
    return this.windows[type]?.[0]
  }

  each(...args) {
    return this.map(...args), this
  }

  get empty() {
    for (let type in this.windows) {
      if (!blank(this.windows[type])) return false
    }
    return true
  }

  first(type) {
    return this.values(type).next().value
  }

  has(type) {
    return array(type).some(t => !blank(this.windows[t]))
  }

  is(win, type) {
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

  // eslint-disable-next-line complexity
  handleIpcMessage = (event, type, ...args) => {
    trace({ args }, `ipc.${type} received`)
    let win = BrowserWindow.fromWebContents(event.sender)

    if (type === 'double-click')
      type = WindowManager.getActionOnDoubleClick()

    switch (type) {
      case 'close':
        win.close()
        break
      case 'reload':
        win.reload()
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
      case 'maximize':
        if (win.isMaximized())
          win.unmaximize()
        else
          win.maximize()
        break
      case 'minimize':
        if (win.isMinimized())
          win.restore()
        else
          win.minimize()
        break
      case 'fixed-size':
        this.setFixedSize(win, ...args)
        break
      case 'rsvp':
        this.handlePendingResponse(...args)
        break
      default:
        win.emit(type, ...args)
    }
  }

  handlePendingResponse(action) {
    try {
      var id = action.meta.rsvp

      if (action.error)
        this.pending[id].reject(action.payload)
      else
        this.pending[id].resolve(action)

    } catch (e) {
      warn({
        stack: e.stack
      }, `failed to resolve pending message ${id}`)
    }
  }

  handleScrollBarsChange = () => {
    this.broadcast('scrollbars', !WindowManager.hasOverlayScrollBars())
  }

  async handleShowDialog(win, { id, type, options }) {
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

  map(type, fn) {
    if (typeof type === 'function') {
      fn = type
      type = undefined
    }

    return Array.from(this.values(type), fn)
  }

  async open(type, args, opts = {}) {
    let props = {
      app: Resource.base,
      env: process.env.NODE_ENV,
      documents: app.getPath('documents'),
      pictures: app.getPath('pictures'),
      theme: 'light',
      aqua: WindowManager.getAquaColorVariant(),
      contrast: nativeTheme.shouldUseHighContrastColors,
      dark: nativeTheme.shouldUseDarkColors,
      scrollbars: !WindowManager.hasOverlayScrollBars(),
      vibrancy: !(await WindowManager.shouldReduceTransparency()),
      motion: !WindowManager.preferReducedMotion(),
      ...args
    }

    let win = await this.create(type, props, opts)

    await win.loadFile(View.expand(type), {
      hash: encodeURIComponent(JSON.stringify({
        ...props,
        maximizable: win.maximizable,
        minimizable: win.minimizable
      }))
    })

    return win
  }

  register(type, win) {
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
          win.webContents.send('reload')
        })
        .on('will-navigate', handleWillNavigate)
        .on('render-process-gone', (_, { reason }) => {
          if (reason !== 'clean-exit') {
            warn(`${type}[${win.id}] render-process crashed: ${reason}`)
            this.emit('crashed', type, win)
          }
        })

      win
        .on('show', () => {
          this.emit('show', type, win)
        })
        .on('close', () => {
          this.emit('close', type, win)
        })
        .once('closed', () => {
          this.unref(type, win)
          this.emit('closed', type, win)
        })

      this.windows[type] = [win, ...array(this.windows[type])]
      this.types.set(win, type)

    } catch (e) {
      this.unref(type, win)
      throw e
    }
  }

  send(type, ...args) {
    this.each(type, win => win.webContents.send(...args))
  }

  rsvp(type, action) {
    let id

    return new Promise((resolve, reject) => {
      id = this.seq.next().value
      let win = this.current(type)

      if (win == null)
        return reject(new Error(`no ${type} window open`))

      action.meta.rsvp = id
      this.pending[id] = { resolve, reject }

      win.webContents.send('dispatch', action)

      // TODO reject pending after timeout!

    }).finally(() => { delete this.pending[id] })
  }

  async enterFixedSize(win) {
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

  leaveFixedSize(win, animate) {
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

  async setFixedSize(win, fixedSize = false, {
    width,
    height,
    animate = true
  } = {}) {
    let { isFixedSize = false } = this.props.get(win) || {}

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
  }

  setTitle(type, title) {
    this.each(type, win => win.setTitle(title))
  }

  async show(type, args, opts) {
    let win = this.current(type)
    if (win) {
      win.show()
    } else {
      win = await this.open(type, args, { show: 'init', ...opts })
      await when(win, 'show', 3000)
    }
    return win
  }

  async start() {
    ipc.on('wm', this.handleIpcMessage)
  }

  async stop(destroy = false) {
    await this.close(undefined, destroy)
    ipc.removeListener('wm', this.handleIpcMessage)
  }

  unref(type, win) {
    this.windows[type] = remove(array(this.windows[type]), win)
    this.types.delete(win)
    this.props.delete(win)
  }

  zoom(factor) {
    factor = restrict(factor, this.MIN_ZOOM, this.MAX_ZOOM)

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

      win.webContents.send('zoom', factor)
    }

    return factor
  }

  *values(type = Object.keys(this.windows)) {
    for (let t of array(type)) {
      if (t in this.windows)
        yield* this.windows[t].values()
    }
  }

  *[Symbol.iterator]() {
    yield* this.values()
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
      width: 600,
      height: 580,
      autoHideMenuBar: true,
      fullscreenable: false,
      maximizable: false,
      minimizable: false,
      resizable: false
    },
    print: {
      width: 600,
      height: 300
    },
    project: {
      width: 1280,
      height: 720,
      minWidth: PANEL.MIN_WIDTH + ESPER.MIN_WIDTH * 2,
      minHeight: PANEL.MIN_HEIGHT * 3 + PANEL.TOOLBAR + PANEL.HEADER_MARGIN,
      vibrancy: 'sidebar'
    }
  }

  MIN_ZOOM = 0.75
  MAX_ZOOM = 2

  static getAquaColorVariant() {
    return darwin && AQUA[
      prefs.getUserDefault('AppleAquaColorVariant', 'string')
    ]
  }

  static hasOverlayScrollBars() {
    return darwin &&
      prefs.getUserDefault('AppleShowScrollBars', 'string') === 'WhenScrolling'
  }

  static getActionOnDoubleClick() {
    return !darwin ? 'maximize' :
      prefs
        .getUserDefault('AppleActionOnDoubleClick', 'string')
        .toLowerCase()
  }

  static print(win, opts = {}) {
    return new Promise((resolve, reject) => {
      win.webContents.print(opts, (success, reason) => {
        if (success)
          resolve('successful')
        else
          reason === 'cancelled' ? resolve(reason) : reject(reason)
      })
    })
  }

  static async printToPDF(win, path, { pageSize, landscape = false } = {}) {
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

  static async shouldReduceTransparency() {
    try {
      // TODO re-enable vibrancy effect when sidebar scrolling
      // performance fixed (or new tag widget has landed)
      return true || darwin &&
        await read('com.apple.universalaccess', 'reduceTransparency')
    } catch (e) {
      warn({ stack: e.stack }, 'failed to check macOS defaults')
    }
  }

  static preferReducedMotion() {
    try {
      return prefs.getAnimationSettings().prefersReducedMotion

    } catch (e) {
      warn({ stack: e.stack }, 'failed to check reduced motion preference')
      return false
    }
  }

  static async leaveFullScreen(win) {
    await setWindowState(win, 'leave-full-screen', 'setFullScreen', false)
  }

  static async unmaximize(win) {
    await setWindowState(win, 'unmaximize')
  }

  static async restore(win) {
    await setWindowState(win, 'restore')
  }

  static async setNormal(win) {
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


const getTrafficLightPosition = (type) => {
  switch (type) {
    case 'prefs':
      return { x: 7, y: 6 }
    default:
      return { x: 12, y: 11 }
  }
}

const AQUA = { 1: 'blue', 6: 'graphite' }

const APP_CMD = {
  'browser-backward': 'back',
  'browser-forward': 'forward'
}

function handleAppCommand(_, name) {
  if (name in APP_CMD)
    this.webContents.send(`global:${APP_CMD[name]}`)
}

function handleWillNavigate(event, url) {
  try {
    let current = new URL(this.getURL())
    let next = new URL(url)

    if (current.pathname !== next.pathname) {
      warn(`win#${this.id} attempted to navigate to ${url}`)
      event.preventDefault()
    }
  } catch (e) {
    event.preventDefault()
    error(e)
  }
}

function webContentsForward(win, events) {
  for (let type of events) {
    win.on(type, () => { win.webContents.send('win', type) })
  }
}

function setWindowState(win, event, setter = event, ...args) {
  let p = when(win, event, 2000)
  win[setter](...args)
  return p
}
