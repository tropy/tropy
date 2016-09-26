'use strict'

const { omit } = require('../common/util')

module.exports = {
  activities(state = {}, { type, meta }) {
    if (meta) {
      const { rel, seq, now } = meta

      if (rel) {
        return omit(state, [rel])
      }

      // TODO use meta.activity
      if (meta.persist) {
        return {
          ...state,
          [seq]: {
            id: seq, type: 'persist', action: type, init: now
          }
        }
      }
    }

    return state
  }
}
