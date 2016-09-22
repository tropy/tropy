'use strict'

const { SHOW } = require('../constants/context')

module.exports = {
  show(event, context = 'global', target, meta) {
    return {
      type: SHOW,
      payload: {
        context,
        event: {
          target,
          x: event.clientX,
          y: event.clientY
        }
      },
      meta: { ipc: true, ...meta }
    }
  }
}
