'use strict'

const { IMPORTS } = require('../constants')

module.exports = {
  restore(payload, meta) {
    return {
      type: IMPORTS.RESTORE,
      payload,
      meta
    }
  }
}
