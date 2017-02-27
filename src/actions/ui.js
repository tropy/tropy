'use strict'

const { CONTEXT, EDIT } = require('../constants/ui')

const edit = {
  cancel(payload, meta) {
    return { type: EDIT.CANCEL, payload, meta }
  },

  start(payload, meta) {
    return {
      type: EDIT.START,
      payload,
      meta
    }
  },

}

const context = {
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


module.exports = {
  context,
  edit
}
