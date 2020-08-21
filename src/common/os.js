'use strict'

const os = require('os')
const fs = require('fs')
const { join } = require('path')
const { mkdtemp } = fs.promises
const { arch, platform } = process

module.exports = {
  get home() {
    return os.homedir()
  },

  get darwin() {
    return platform === 'darwin'
  },

  get linux() {
    return platform === 'linux'
  },

  get win32() {
    return platform === 'win32'
  },

  get system() {
    return `${os.type()} ${os.release()} (${arch})`
  },

  mkdtmp(name = 'tropy') {
    return mkdtemp(join(os.tmpdir(), name))
  },

  normalize: platform === 'win32' ?
    (path) => path :
    (path) => path.replace(/\\/g, '/'),

  meta: platform === 'darwin' ?
    (event) => event.metaKey :
    (event) => event.ctrlKey
}
