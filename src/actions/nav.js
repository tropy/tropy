'use strict'

const {
  UPDATE, RESTORE, SELECT
} = require('../constants/nav')

module.exports = {
  restore(payload, meta) {
    return {
      type: RESTORE,
      payload,
      meta: { ...meta } }
  },

  update(payload, meta) {
    return { type: UPDATE, payload, meta }
  },

  select(payload, meta) {
    return { type: SELECT, payload, meta: { search: true, ...meta } }
  }
}
