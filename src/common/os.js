'use strict'

const { release } = require('os')
const { platform } = process

module.exports = {

  get EL_CAPITAN() {
    return platform === 'darwin' && release() > '15'
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


  meta: platform === 'darwin' ?
    (event) => event.metaKey :
    (event) => event.ctrlKey
}
