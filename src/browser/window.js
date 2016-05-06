'use strict'

const { app, BrowserWindow } = require('electron')
const { resolve, join } = require('path')
const { format } = require('url')
const { assign } = Object

const root = resolve(__dirname, '..', '..', 'static')

const channel = process.env.NODE_ENV === 'production' ? 'stable' : 'dev'
const icons = resolve(__dirname, '..', '..', 'res', 'icons', channel)


class Window extends BrowserWindow {
  static get defaults() {
    return {
      title: app.getName(),
      show: false,
      overlayScrollbars: true,
      icon: (process.platform === 'linux') ?
        join(icons, 'tropy', '512.png') : undefined,
      webPreferences: {
        preload: resolve(__dirname, '..', 'bootstrap.js')
      }
    }
  }

  constructor(options = {}) {
    super(assign({}, new.target.defaults, options))

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

class Wizard extends Window {
  static get defaults() {
    return assign(super.defaults, {
      frame: false,
      width: 320,
      height: 480
    })
  }
}

module.exports = {
  Window, Wizard
}
