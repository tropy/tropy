'use strict'

const { BrowserWindow, systemPreferences: pref } = require('electron')
const { resolve, join } = require('path')
const { format } = require('url')
const { EL_CAPITAN } = require('../common/os')
const { warn } = require('../common/log')

const ROOT = resolve(__dirname, '..', '..', 'static')

const DEFAULTS = {
  show: false,
  frame: true,
  useContentSize: true,
  webPreferences: {
    zoomFactor: global.ARGS.zoom || 1,
    preload: resolve(__dirname, '..', 'bootstrap.js'),
    experimentalFeatures: true
  }
}

const EVENTS = [
  'focus',
  'blur',
  'maximize',
  'unmaximize',
  'enter-full-screen',
  'leave-full-screen'
]

const AQUA = {
  1: 'blue',
  6: 'graphite'
}

function hasOverlayScrollBars() {
  return 'darwin' === process.platform &&
    'WhenScrolling' === pref.getUserDefault('AppleShowScrollBars', 'string')
}

module.exports = {

  open(file, data = {}, options = {}) {
    options = { ...DEFAULTS, ...options }

    switch (process.platform) {
      case 'darwin':
        if (!options.frame && EL_CAPITAN) {
          options.frame = true
          options.titleBarStyle = options.titleBarStyle || 'hidden-inset'
        }

        data.aqua = AQUA[
          pref.getUserDefault('AppleAquaColorVariant', 'integer')
        ]

        break
    }

    data.scrollbars = !hasOverlayScrollBars()

    const win = new BrowserWindow(options)
      .once('ready-to-show', () => { win.show() })

    win.webContents
      .on('devtools-reload-page', () => {
        win.webContents.send('reload')
      })

      .on('will-navigate', (event, url) => {
        if (url !== win.webContents.getURL()) {
          warn(`win#${win.id} attempted to navigate to ${url}`)
          event.preventDefault()
        }
      })


    for (let event of EVENTS) {
      win.on(event, () => { win.webContents.send('win', event) })
    }

    win.loadURL(format({
      protocol: 'file',
      pathname: join(ROOT, `${file}.html`),
      hash: encodeURIComponent(JSON.stringify(data))
    }))

    return win
  },

  hasOverlayScrollBars
}
