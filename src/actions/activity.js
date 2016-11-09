'use strict'

module.exports = {
  done(action, payload) {
    return {
      type: action.type,
      payload,
      error: payload instanceof Error,
      meta: {
        done: true,
        ipc: action.meta.ipc,
        rel: action.meta.seq,
        was: action.meta.now
      }
    }
  }
}
