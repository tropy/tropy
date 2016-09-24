'use strict'

module.exports = {
  activity(state = {}, { type, payload, error, meta }) {
    if (meta) {
      const { rel, seq, now } = meta

      if (rel) {
        return {
          ...state,
          [rel]: {
            ...state[rel],
            done: now,
            error: error ? payload.message : null
          }
        }
      }

      // TODO use meta.activity
      if (meta.persist) {
        return {
          ...state,
          [seq]: {
            type: 'persist', action: type, init: now
          }
        }
      }
    }

    return state
  }
}
