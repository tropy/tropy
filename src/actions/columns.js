'use strict'

const { COLUMNS } = require('../constants')

module.exports = {
  restore(payload, meta) {
    return {
      type: COLUMNS.RESTORE,
      payload,
      meta
    }
  }
}
