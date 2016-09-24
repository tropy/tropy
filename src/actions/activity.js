'use strict'

module.exports = {
  done(action, payload) {
    return {
      type: action.type,
      payload,
      error: payload instanceof Error,
      meta: {
        rel: action.meta.seq
      }
    }
  }
}
