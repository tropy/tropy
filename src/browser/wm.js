'use strict'

const { EventEmitter } = require('events')
const { join } = require('path')
const { URL } = require('url')
const dialog = require('./dialog')
const { debug, error, trace, warn } = require('../common/log')
const { darwin, EL_CAPITAN } = require('../common/os')
const { channel } = require('../common/release')
const res = require('../common/res')
const { BODY, PANEL, ESPER } = require('../constants/sass')

const {
  array,
  blank,
  counter,
  get,
  once,
  remove,
  restrict
} = require('../common/util')

const {
  app,
  BrowserWindow,
  ipcMain: ipc,
  nativeTheme,
  systemPreferences: prefs
} = require('electron')



class WindowManager extends EventEmitter {
  constructor(defaults = {}) {
    super()

    this.defaults = {
      disableAutoHideCursor: darwin,
      resizable: true,
      useContentSize: false,
      show: false,
      webPreferences: {
        defaultEncoding: 'UTF-8',
        enableRemoteModule: true,
        nodeIntegration: true,
        preload: join(__dirname, '..', 'bootstrap.js'),
        ...defaults.webPreferences
      }
    }

    this.windows = {}
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
  create(type, args = {}, opts) {
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

      let isDarkMode = nativeTheme.shouldUseDarkColors

      opts.backgroundColor =
        BODY[process.platform][isDarkMode ? 'dark' : 'light']

      switch (process.platform) {
        case 'linux':
          opts.icon = res.icon.expand(channel, 'tropy', '512x512.png')
          opts.darkTheme = opts.darkTheme || isDarkMode
          break
        case 'darwin':
          if (!opts.frame && EL_CAPITAN) {
            opts.frame = true
            opts.title = ''
            opts.titleBarStyle = opts.titleBarStyle || 'hiddenInset'
          }
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
    return get(this.windows, [type, 0])
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

  handleFocus = (type, win) => {
    if (this._cid !== win.id) {
      this._cid = win.id

      if (this.windows[type][0] !== win) {
        this.windows[type] = [win, ...remove(this.windows[type], win)]
      }

      this.emit('focus-change', type, win)
    }
  }

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
          win.unminimize()
        else
          win.minimize()
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
    let win = this.create(type, args, opts)

    await win.loadFile(res.view.expand(type), {
      hash: encodeURIComponent(JSON.stringify({
        aqua: WindowManager.getAquaColorVariant(),
        contrast: nativeTheme.shouldUseHighContrastColors,
        dark: nativeTheme.shouldUseDarkColors,
        environment: process.env.NODE_ENV,
        documents: app.getPath('documents'),
        maximizable: win.maximizable,
        minimizable: win.minimizable,
        pictures: app.getPath('pictures'),
        scrollbars: !WindowManager.hasOverlayScrollBars(),
        theme: 'light',
        ...args
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
        .on('crashed', () => {
          warn(`${type}[${win.id}] contents crashed`)
          this.emit('crashed', type, win)
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

  setTitle(type, title, frameless = false) {
    if (!frameless || !(darwin && EL_CAPITAN)) {
      this.each(type, win => win.setTitle(title))
    }
  }

  async show(type, args, opts) {
    let win = this.current(type)
    if (win) {
      win.show()
    } else {
      win = await this.open(type, args, { show: 'init', ...opts })
      await once(win, 'show')
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
      height: 300,
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
      minHeight: PANEL.MIN_HEIGHT * 3 + PANEL.TOOLBAR + PANEL.HEADER_MARGIN
    },
    wizard: {
      width: 456,
      height: 580,
      autoHideMenuBar: true,
      fullscreenable: false,
      maximizable: false,
      minimizable: false,
      resizable: false
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


module.exports = WindowManager
