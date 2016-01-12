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
  constructor(state = {}, options = {}) {
    super(assign({}, defaults, options))

    //this.state = state
    this.webContents.once('dom-ready', () => this.show())
  }

  get state() {
    return this.getBounds()
  }

  set state(state) {
    this.setBounds(state)
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
