'use strict'

const { UI } = require('../constants')

module.exports = {
  restore(payload, meta) {
    return {
      type: UI.RESTORE,
      payload,
      meta
    }
  },

  update(payload, meta) {
    return {
      type: UI.UPDATE,
      payload,
      meta: { throttle: true, ...meta }
    }
  },

  panel: {
    update(payload, meta) {
      return {
        type: UI.PANEL.UPDATE,
        payload,
        meta: { throttle: true, ...meta }
      }
    }
  }
}
