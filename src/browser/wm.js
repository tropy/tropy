'use strict'

const { EventEmitter } = require('events')
const { join } = require('path')
const { URL } = require('url')
const { BrowserWindow } = require('electron')
const { darwin, EL_CAPITAN } = require('../common/os')
const { channel } = require('../common/release')
const { warn } = require('../common/log')
const { remove } = require('../common/util')
const { BODY, PANEL, ESPER } = require('../constants/sass')


class WindowManager extends EventEmitter {
  constructor(app) {
    super()
    this.app = app
    this.windows = {}
  }

  get current() {
    return BrowserWindow.getFocusedWindow()
  }

  register(type, win) {
    win.on('page-title-updated', (event) => {
      event.preventDefault()
    })

    win.on('app-command', (_, name) => {
      if (name in APP_CMD)
        win.webContents.send(`global:${APP_CMD[name]}`)
    })

    win.on('unresponsive', () => {
      warn(`${type}[${win.id}] has become unresponsive`)
      this.emit('unresponsive', type, win)
    })

    win.once('close', () => {
      this.emit('close', type, win)
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
      .on('did-finish-load', () => {
        win.webContents.setVisualZoomLevelLimits(1, 1)
      })
      .on('will-navigate', handleWillNavigate)
      .on('crashed', () => {
        warn(`${type}[${win.id}] contents crashed`)
        this.emit('crashed', type, win)
      })

    win.once('closed', () => {
      this.emit('closed', type, win)
      this.windows[type] = remove(this.windows[type], win)
    })

    this.windows[type] = [win, ...this.windows[type]]
    this.emit('created', type, win)
    return win
  }

  // eslint-disable-next-line complexity
  create(type, args, opts) {
    opts = WindowManager.configure(opts, type)

    if (args.zoom > 1) {
      opts.webPreferences.zoomFactor = args.zoom

      if (!opts.resizable) {
        opts.width *= args.zoom
        opts.height *= args.zoom
      }

      for (let dim of ['minWidth', 'minHeight']) {
        if (opts[dim]) opts[dim] *= args.zoom
      }
    }

    if (args.frameless) {
      opts.title = ''
      opts.frame = false
    }

    let isDark = args.theme === 'dark' || args.theme === 'system' && args.dark
    opts.backgroundColor = BODY[isDark ? 'dark' : 'light']

    switch (process.platform) {
      case 'linux':
        opts.icon = join(ICONS, '512x512.png')
        opts.darkTheme = opts.darkTheme || isDark
        break
      case 'darwin':
        if (!opts.frame && EL_CAPITAN) {
          opts.frame = true
          opts.titleBarStyle = opts.titleBarStyle || 'hiddenInset'
        }
        break
    }

    return this.register(type, new BrowserWindow(opts))
  }

  open(type, args, opts) {
    return new Promise((resolve) => {
      let win = this.create(type, args, opts)

      win.once('ready-to-show', () => {
        this.emit('ready-to-show', type, win)
        resolve(win)
      })

      win.loadFile(join(ROOT, `${type}.html`), {
        hash: encodeURIComponent(JSON.stringify(args))
      })
    })
  }

  dispatch(action, win = this.current) {
    if (win != null) {
      win.webContents.send('dispatch', action)
    }
  }

  broadcast(...args) {
    for (let win of this) {
      win.webContents.send(...args)
    }
  }

  *[Symbol.iterator]() {
    for (let win of BrowserWindow.getAlLWindows()) {
      yield win
    }
  }

  static configure(opts, type) {
    return {
      show: false,
      useContentSize: false,
      disableAutoHideCursor: darwin,
      ...WindowManager.defaults[type],
      ...opts,
      webPreferences: {
        ...WindowManager.webPreferences,
        ...WindowManager.defaults[type].webPreferences,
        ...opts.webPreferences
      }
    }
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
      height: 580
    },
    project: {
      width: 1280,
      height: 720,
      minWidth: PANEL.MIN_WIDTH + ESPER.MIN_WIDTH * 2,
      minHeight: PANEL.MIN_HEIGHT * 3 + PANEL.TOOLBAR + PANEL.HEADER_MARGIN
    },
    wizard: {
      width: 456,
      height: 580
    }
  }

  static webPreferences = {
    contextIsolation: false,
    defaultEncoding: 'UTF-8',
    nodeIntegration: true,
    preload: join(__dirname, '..', 'bootstrap.js')
  }

  static get types() {
    return Object.keys(WindowManager.defaults)
  }
}


const ROOT = join(__dirname, '..', '..', 'static')
const ICONS = join(__dirname, '..', '..', 'res', 'icons', channel, 'tropy')

const APP_CMD = {
  'browser-backward': 'back',
  'browser-forward': 'forward'
}

function webContentsForward(win, events) {
  for (let event of events) {
    win.on(event, () => { win.webContents.send('win', event) })
  }
}

function handleWillNavigate(event, url) {
  try {
    let current = new URL(this.getURL())
    let next = new URL(url)

    if (current.pathname !== next.pathname) {
      warn(`win#${this.id} attempted to navigate to ${url}`)
      event.preventDefault()
    }
  } catch (error) {
    event.preventDefault()
    warn(`win#${this.id} attempted to navigate to ${url}`, {
      stack: error.stack
    })
  }
}

module.exports = WindowManager
