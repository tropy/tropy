'use strict'

const { IDLE, ACTIVE } = require('../constants/idle')

module.exports = {
  active(payload, meta = {}) {
    return { type: ACTIVE, payload, meta }
  },

  idle(payload, meta = {}) {
    return { type: IDLE, payload, meta }
  }
}
