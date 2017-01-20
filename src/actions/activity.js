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
        load: action.meta.load,
        search: action.meta.search,
        rel: action.meta.seq,
        was: action.meta.now
      }
    }
  }
}
