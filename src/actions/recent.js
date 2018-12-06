'use strict'

const { RECENT } = require('../constants')

module.exports = {
  restore(payload, meta = {}) {
    return {
      type: RECENT.RESTORE,
      payload,
      meta
    }
  }
}
