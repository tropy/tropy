'use strict'

const { SETTINGS } = require('../constants')

module.exports = {
  close(payload, meta = {}) {
    return { type: SETTINGS.CLOSE, payload, meta }
  },

  restore(payload, meta = {}) {
    return { type: SETTINGS.RESTORE, payload, meta }
  },

  update(payload, meta = {}) {
    return { type: SETTINGS.UPDATE, payload, meta }
  }
}

