'use strict'

const { BrowserWindow } = require('electron')
const { resolve } = require('path')
const { format } = require('url')
const { assign } = Object

const root = resolve(__dirname, '..', '..', 'static')

const defaults = {
  show: false,
  preload: resolve(__dirname, '..', 'bootstrap.js')
}

class Window extends BrowserWindow {
  constructor(options = {}) {
    super(assign({}, defaults, options))

    this.webContents.on('dom-ready', () => this.show())
  }

  open(file, data = {}) {
    return this.loadURL(format({
      protocol: 'file',
      pathname: [root, file].join('/'),
      hash: encodeURIComponent(JSON.stringify(data))
    })), this
  }
}

module.exports = Window
