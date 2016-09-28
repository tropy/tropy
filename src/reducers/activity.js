'use strict'

const { omit } = require('../common/util')

module.exports = {
  activities(state = {}, { type, meta }) {
    if (meta) {
      const { rel, seq, now, cmd } = meta

      if (rel) {
        return omit(state, [rel])
      }

      if (cmd) {
        return {
          ...state,
          [seq]: {
            id: seq, type, init: now
          }
        }
      }
    }

    return state
  }
}
