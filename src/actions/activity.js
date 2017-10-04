'use strict'

const { ACTIVITY } = require('../constants')

module.exports = {
  done(action, result, meta) {
    return {
      type: action.type,
      payload: result,
      error: result instanceof Error,
      meta: {
        ipc: action.meta.ipc,
        idx: action.meta.idx,
        search: action.meta.search,
        ...meta,
        done: true,
        rel: action.meta.seq,
        was: action.meta.now
      }
    }
  },

  update(action, payload, meta) {
    return {
      type: ACTIVITY.UPDATE,
      payload,
      meta: {
        ...meta,
        rel: action.meta.seq,
        was: action.meta.now
      }
    }
  }
}
