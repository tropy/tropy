'use strict'

const { release } = require('os')

module.exports = {

  get EL_CAPITAN() {
    return process.platform === 'darwin' && release() > '15'
  },

  get darwin() {
    return process.platform === 'darwin'
  },

  meta: process.platform === 'darwin' ?
    (event) => event.metaKey :
    (event) => event.ctrlKey
}
