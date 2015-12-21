'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')
const { BrowserWindow } = require('electron')
const url = require('url')

const pkg = require('../../package')

const prop = Object.defineProperty

module.exports = class Tropy extends EventEmitter {

  constructor({ environment, debug } = {}) {
    if (Tropy.instance) return Tropy.instance

    super()
    Tropy.instance = this

    prop(this, 'debug', { value: debug })
    prop(this, 'environment', { value: environment || process.env.NODE_ENV })

    prop(this, 'home', {
      value: resolve(__dirname, '..', '..')
    })

    prop(this, 'hash', {
      value: encode({ environment, debug })
    })
  }

  open() {
    if (!this.win) {
      this.win = new BrowserWindow({
        preload: resolve(__dirname, '..', 'preload.js')
      })
        .once('closed', () => { this.win = undefined })

      this.win.loadURL(this.url('index.html'))

    } else {
      this.win.show()
    }

    return this
  }

  url(filename) {
    return url.format({
      protocol: 'file',
      pathname: `${this.home}/static/${filename}`,
      hash: this.hash
    })
  }

  get version() {
    return pkg.version
  }

  get development() {
    return this.environment === 'development'
  }
  get production() {
    return this.environment === 'production'
  }
}

function encode(data) {
  return encodeURIComponent(JSON.stringify(data))
}
