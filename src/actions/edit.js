'use strict'

const { EDIT } = require('../constants')

module.exports = {
  cancel(payload, meta) {
    return {
      type: EDIT.CANCEL,
      payload,
      meta
    }
  },

  start(payload, meta) {
    return {
      type: EDIT.START,
      payload,
      meta
    }
  }
}
