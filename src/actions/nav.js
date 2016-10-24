'use strict'

const { UPDATE, RESTORE } = require('../constants/nav')

module.exports = {
  restore(payload, meta) {
    return { type: RESTORE, payload, meta: { search: true, ...meta } }
  },

  update(payload) {
    return { type: UPDATE, payload }
  }
}
