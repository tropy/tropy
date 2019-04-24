'use strict'

const { EventEmitter } = require('events')
const { join } = require('path')
const { URL } = require('url')
const { app, BrowserWindow, ipcMain, systemPreferences } = require('electron')
const { getUserDefault } = systemPreferences
const { darwin, EL_CAPITAN } = require('../common/os')
const { channel } = require('../common/release')
const { warn } = require('../common/log')
const { array, blank, get, remove } = require('../common/util')
const { BODY, PANEL, ESPER } = require('../constants/sass')


class WindowManager extends EventEmitter {
  constructor(defaults = {}) {
    super()

    this.defaults = {
      show: false,
      useContentSize: false,
      disableAutoHideCursor: darwin,
      webPreferences: {
        contextIsolation: false,
        defaultEncoding: 'UTF-8',
        nodeIntegration: true,
        preload: join(__dirname, '..', 'bootstrap.js'),
        ...defaults.webPreferences
      }
    }

    this.windows = {}

    ipcMain.on('wm', this.handleIpcMessage)
  }

  broadcast(...args) {
    for (let win of this) win.webContents.send(...args)
  }

  configure(type, opts = {}) {
    return {
      ...this.defaults,
      ...WindowManager.defaults[type],
      ...opts,
      show: false,
      webPreferences: {
        ...this.defaults.webPreferences,
        ...WindowManager.defaults[type].webPreferences,
        ...opts.webPreferences
      }
    }
  }

  // eslint-disable-next-line complexity
  create(type, args = {}, opts) {
    try {
      opts = this.configure(type, opts)

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
        opts.frame = false
      }

      let isDark = args.theme === 'dark' ||
        args.theme === 'system' && systemPreferences.isDarkMode()

      opts.backgroundColor = BODY[isDark ? 'dark' : 'light']

      switch (process.platform) {
        case 'linux':
          opts.icon = join(ICONS, '512x512.png')
          opts.darkTheme = opts.darkTheme || isDark
          break
        case 'darwin':
          if (!opts.frame && EL_CAPITAN) {
            opts.frame = true
            opts.title = ''
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

  close(type) {
    return Promise.all(this.map(type, win =>
      new Promise((resolve) => {
        win.once('closed', resolve)
        win.close()
      })
    ))
  }

  current(type = 'project') {
    return get(this.windows, [type, 0])
  }

  async destroy() {
    await this.close()
    ipcMain.removeListener('wm', this.handleIpcMessage)
  }

  each(...args) {
    return this.map(...args), this
  }

  has(type) {
    return !blank(this.windows[type])
  }

  handleIpcMessage = (event, type, message, ...args) => {
    let win = BrowserWindow.fromWebContents(event.sender)
    // Note: assuming we would want to use multiple WindowManagers,
    // add a check here to make sure the window is controlled
    // by this manager instance!
    this.emit(message, type, win, ...args)
    win.emit(`wm-${message}`, ...args)
  }

  handleScrollBarsChange = () => {
    this.broadcast('scrollbars', !WindowManager.hasOverlayScrollBars())
  }

  map(type, fn) {
    if (typeof type === 'function') {
      fn = type
      type = undefined
    }

    return Array.from(this.values(type), fn)
  }

  open(type, args, opts = {}) {
    return new Promise((resolve, reject) => {
      let ready = opts.openResolvesWhen || 'wm-ready'
      let win = this.create(type, args, opts)

      win.loadFile(join(ROOT, `${type}.html`), {
        hash: encodeURIComponent(JSON.stringify({
          aqua: WindowManager.getAquaColorVariant(),
          dark: systemPreferences.isDarkMode(),
          environment: process.env.NODE_ENV,
          home: app.getPath('userData'),
          documents: app.getPath('documents'),
          pictures: app.getPath('pictures'),
          scrollbars: !WindowManager.hasOverlayScrollBars(),
          ...args
        }))
      })

      let cancel = () => {
        win.removeListener(ready, done)
        reject(new Error(`${type}[${win.id}] closed prematurely`))
      }

      let done = () => {
        win.removeListener('closed', cancel)
        resolve(win)
      }

      win.once('closed', cancel)
      win.once(ready, done)
    })
  }

  register(type, win) {
    try {
      win
        .on('app-command', handleAppCommand)
        //.on('focus', () => this.handleFocus(type, win))
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

  setTitle(type, title, frameless = false) {
    if (!frameless || !(darwin && EL_CAPITAN)) {
      this.each(type, win => win.setTitle(title))
    }
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

  static getAquaColorVariant() {
    return darwin && AQUA[getUserDefault('AppleAquaColorVariant', 'integer')]
  }

  static hasOverlayScrollBars() {
    return darwin &&
      getUserDefault('AppleShowScrollBars', 'string') === 'WhenScrolling'
  }
}


const ROOT = join(__dirname, '..', '..', 'static')
const ICONS = join(__dirname, '..', '..', 'res', 'icons', channel, 'tropy')

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
