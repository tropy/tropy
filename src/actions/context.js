'use strict'

const { SHOW } = require('../constants/context')

module.exports = {
  show(event, context = 'global', meta) {
    return {
      type: SHOW,
      payload: {
        context,
        event: {
          x: event.clientX,
          y: event.clientY
        }
      },
      meta: { ipc: true, ...meta }
    }
  }
}
