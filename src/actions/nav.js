'use strict'

const { UPDATE, RESTORE } = require('../constants/nav')

module.exports = {
  restore(payload) {
    return { type: RESTORE, payload }
  },

  update(payload) {
    return { type: UPDATE, payload }
  }
}
