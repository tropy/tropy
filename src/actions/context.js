'use strict'

const { SHOW } = require('../constants/context')

module.exports = {
  show(payload, meta) {
    return { type: SHOW, payload, meta: { ipc: true, ...meta } }
  }
}
