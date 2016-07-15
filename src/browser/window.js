'use strict'

const { BrowserWindow } = require('electron')
const { resolve } = require('path')
const { format } = require('url')
const { EL_CAPITAN } = require('../common/os')

const root = resolve(__dirname, '..', '..', 'static')

const DEFAULTS = {
  show: false,
  frame: true,
  webPreferences: {
    preload: resolve(__dirname, '..', 'bootstrap.js')
  }
}

const EVENTS = [
  'focus', 'blur', 'maximize', 'unmaximize'
]

module.exports = {

  open(file, data = {}, options = {}) {
    options = { ...DEFAULTS, ...options }

    if (!options.frame && EL_CAPITAN) {
      options.frame = true
      options.titleBarStyle = 'hidden-inset'
    }

    let win = new BrowserWindow(options)
      .once('closed', () => { win = undefined })
      .once('ready-to-show', () => { win.show() })

    for (let event of EVENTS) {
      win.on(event, () => { win.webContents.send('win', event) })
    }

    win.loadURL(format({
      protocol: 'file',
      pathname: [root, file].join('/'),
      hash: encodeURIComponent(JSON.stringify(data))
    }))

    return win
  }
}
