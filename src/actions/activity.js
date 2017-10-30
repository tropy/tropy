'use strict'

const { ACTIVITY } = require('../constants')
const { pick } = require('../common/util')

module.exports = {
  done(action, result, meta) {
    const error = result instanceof Error
    const payload = !error ?
      result :
      pick(result, ['code', 'message', 'stack', 'type'])

    return {
      type: action.type,
      payload,
      error,
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
