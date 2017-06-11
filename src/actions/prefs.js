'use strict'

const { PREFS } = require('../constants')

module.exports = {
  close(payload, meta = {}) {
    return {
      type: PREFS.CLOSE,
      payload,
      meta
    }
  },

  update(payload, meta = {}) {
    return {
      type: PREFS.UPDATE,
      payload,
      meta
    }
  }
}
