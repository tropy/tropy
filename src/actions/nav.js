'use strict'

const {
  UPDATE, RESTORE, SELECT, PANEL
} = require('../constants/nav')

module.exports = {
  restore(payload, meta) {
    return {
      type: RESTORE,
      payload,
      meta: { ...meta }
    }
  },

  update(payload, meta) {
    return { type: UPDATE, payload, meta }
  },

  select(payload, meta) {
    return { type: SELECT, payload, meta: { search: true, ...meta } }
  },

  panel: {
    update(payload, meta) {
      return { type: PANEL.UPDATE, payload, meta }
    }
  }
}
