'use strict'

module.exports = {
  done(action, result, meta) {
    return {
      type: action.type,
      payload: result,
      error: result instanceof Error,
      meta: {
        ipc: action.meta.ipc,
        load: action.meta.load,
        search: action.meta.search,
        ...meta,
        done: true,
        rel: action.meta.seq,
        was: action.meta.now
      }
    }
  }
}
