'use strict'

const { EventEmitter } = require('events')
const { join } = require('path')
const { URL } = require('url')
const { BrowserWindow } = require('electron')
const { darwin, EL_CAPITAN } = require('../common/os')
const { channel } = require('../common/release')
const { warn } = require('../common/log')
const { array, blank, get, remove } = require('../common/util')
const { BODY, PANEL, ESPER } = require('../constants/sass')


class WindowManager extends EventEmitter {
  constructor() {
    super()
    this.windows = {}
  }

  broadcast(...args) {
    for (let win of this) win.webContents.send(...args)
  }

  // eslint-disable-next-line complexity
  create(type, args, opts) {
    try {
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

      var win = new BrowserWindow(opts)

      this.register(type, win)
      this.emit('created', type, win)

      return win

    } catch (error) {
      if (win != null) win.destroy()
      throw error
    }
  }

  current(type = 'project') {
    return get(this.windows, [type, 0])
  }

  each(type, fn) {
    for (let win of this.values(type)) fn(win)
  }

  has(type) {
    return !blank(this.windows[type])
  }

  open(type, args, opts) {
    return new Promise((resolve, reject) => {
      let win = this.create(type, args, opts)

      win.loadFile(join(ROOT, `${type}.html`), {
        hash: encodeURIComponent(JSON.stringify(args))
      })

      win.once('closed', reject)
      win.once('ready-to-show', () => {
        win.removeListener('closed', reject)
        this.emit('ready-to-show', type, win)
        resolve(win)
      })
    })
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
        .on('did-finish-load', () => {
          win.webContents.setVisualZoomLevelLimits(1, 1)
        })
        .on('will-navigate', handleWillNavigate)
        .on('crashed', () => {
          warn(`${type}[${win.id}] contents crashed`)
          this.emit('crashed', type, win)
        })

      win
        .once('close', () => {
          this.emit('close', type, win)
        })
        .once('closed', () => {
          this.emit('closed', type, win)
          this.unref(type, win)
        })

      this.windows[type] = [win, ...array(this.windows[type])]

    } catch (error) {
      this.unref(type, win)
      throw error
    }
  }

  send(type, ...args) {
    this.each(type, win => win.webContents.send(...args))
  }

  async show(type, ...args) {
    let win = this.current(type) || await this.open(type, ...args)
    win.show()
    return win
  }

  unref(type, win) {
    this.windows[type] = remove(array(this.windows[type]), win)
  }

  *values(types = Object.keys(this.windows)) {
    for (let type of array(types)) {
      if (type in this.windows)
        yield* this.windows[type].values()
    }
  }

  *[Symbol.iterator]() {
    yield* this.values()
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
  } catch (error) {
    event.preventDefault()
    warn(`win#${this.id} attempted to navigate to ${url}`, {
      stack: error.stack
    })
  }
}

function webContentsForward(win, events) {
  for (let event of events) {
    win.on(event, () => { win.webContents.send('win', event) })
  }
}


module.exports = WindowManager
