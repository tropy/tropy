'use strict'

const { PREFS } = require('../constants')

module.exports = {
  update(payload, meta = {}) {
    return {
      type: PREFS.UPDATE,
      payload,
      meta
    }
  }
}
