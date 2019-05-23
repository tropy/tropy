'use strict'

const { protocol } = require('electron')
const { capitalize } = require('../common/util')

module.exports = {
  register(scheme, type, handler) {
    return new Promise((resolve, reject) => {
      protocol[`register${capitalize(type)}Protocol`](
        scheme,
        handler,
        err => (err != null) ? reject(err) : resolve())
    })
  },

  unregister(scheme) {
    return new Promise((resolve, reject) => {
      protocol.unregisterProtocol(
        scheme,
        err => (err != null) ? reject(err) : resolve())
    })
  }
}
