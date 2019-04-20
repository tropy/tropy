'use strict'

const { BrowserWindow, systemPreferences: prefs } = require('electron')
const { join } = require('path')
const { format, parse } = require('url')
const { darwin, EL_CAPITAN } = require('../common/os')
const { channel } = require('../common/release')
const { warn } = require('../common/log')

const ROOT = join(__dirname, '..', '..', 'static')
const ICON = join(__dirname, '..', '..', 'res', 'icons', channel, 'tropy')

const DEFAULTS = {
  show: false,
  frame: true,
  useContentSize: true,
  webPreferences: {
    contextIsolation: false,
    defaultEncoding: 'UTF-8',
    experimentalFeatures: false,
    nodeIntegration: true,
    preload: join(__dirname, '..', 'bootstrap.js')
  }
}

const EVENTS = [
  'focus',
  'blur',
  'maximize',
  'unmaximize',
  'enter-full-screen',
  'leave-full-screen',
  'show'
]

const AQUA = {
  1: 'blue',
  6: 'graphite'
}

const APP_COMMANDS = {
  'browser-backward': 'back',
  'browser-forward': 'forward'
}

function hasOverlayScrollBars() {
  return darwin &&
    'WhenScrolling' === prefs.getUserDefault('AppleShowScrollBars', 'string')
}

module.exports = {
  open(file, data = {}, options = {}, zoom = 1) {
    options = {
      ...DEFAULTS,
      ...options,
      webPreferences: { ...DEFAULTS.webPreferences, ...options.webPreferences }
    }

    switch (process.platform) {
      case 'linux':
        options.icon = join(ICON, '512x512.png')
        break

      case 'darwin':
        options.disableAutoHideCursor = true
        if (!options.frame && EL_CAPITAN) {
          options.frame = true
          options.titleBarStyle = options.titleBarStyle || 'hiddenInset'
        }

        data.aqua = AQUA[
          prefs.getUserDefault('AppleAquaColorVariant', 'integer')
        ]

        break
    }

    data.scrollbars = !hasOverlayScrollBars()

    const win = new BrowserWindow(options)

    win.webContents
      .on('devtools-reload-page', () => {
        win.webContents.send('reload')
      })

      .on('did-finish-load', () => {
        win.webContents.setZoomFactor(zoom)
        win.webContents.setVisualZoomLevelLimits(1, 1)
      })

      .on('will-navigate', (event, url) => {
        try {
          const cur = parse(win.webContents.getURL())
          const nxt = parse(url)

          if (cur.pathname !== nxt.pathname) {
            warn(`win#${win.id} attempted to navigate to ${url}`)
            event.preventDefault()
          }
        } catch (error) {
          warn(`win#${win.id} attempted to navigate to ${url}`, {
            stack: error.stack
          })
          event.preventDefault()
        }
      })

    for (let event of EVENTS) {
      win.on(event, () => { win.webContents.send('win', event) })
    }

    win.on('app-command', (_, name) => {
      if (name in APP_COMMANDS) {
        win.webContents.send(`global:${APP_COMMANDS[name]}`)
      }
    })

    win.on('page-title-updated', (event) => {
      event.preventDefault()
    })

    win.loadURL(format({
      protocol: 'file',
      pathname: join(ROOT, `${file}.html`),
      hash: encodeURIComponent(JSON.stringify(data))
    }))

    return win
  },

  hasOverlayScrollBars
}
