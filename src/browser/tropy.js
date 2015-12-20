'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')
const { BrowserWindow } = require('electron')

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
  }

  open() {
    if (!this.win) {
      this.win = new BrowserWindow({})
        .once('closed', () => { this.win = undefined })

      this.win.loadURL(`file://${this.home}/static/index.html`)
    }

    return this
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
