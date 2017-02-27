'use strict'

const { CONTEXT } = require('../constants')

module.exports = {
  show(event, scope = 'global', target, meta) {
    return {
      type: CONTEXT.SHOW,
      payload: {
        scope,
        event: {
          target,
          x: event.clientX,
          y: event.clientY
        }
      },
      meta: { ipc: true, ...meta }
    }
  },

  clear(payload, meta) {
    return { type: CONTEXT.CLEAR, payload, meta }
  }
}
