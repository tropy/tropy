'use strict'

module.exports = {
  done(action, payload) {
    return {
      type: action.type,
      payload,
      error: payload instanceof Error,
      meta: {
        done: true,
        rel: action.meta.seq
      }
    }
  }
}
