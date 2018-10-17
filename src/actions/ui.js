'use strict'

const { UI } = require('../constants')

module.exports = {
  restore(payload, meta) {
    // Remove pre 1.3 state
    if (payload.image) delete payload.image
    if (payload.note) delete payload.note

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
      meta: { throttle: true, log: 'silly', ...meta }
    }
  }
}
