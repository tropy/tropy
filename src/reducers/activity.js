'use strict'

const { omit } = require('../common/util')
const { ACTIVITY } = require('../constants')

module.exports = {
  activities(state = {}, { type, payload, meta = {} }) {
    const { rel, seq, now, done } = meta

    switch (true) {
      case type === ACTIVITY.UPDATE:
        return {
          ...state,
          [rel]: { ...state[rel], ...payload }
        }

      case done:
        return omit(state, [rel])

      case meta.async:
        return {
          ...state,
          [seq]: { id: seq, type, init: now }
        }

      default:
        return state
    }
  }
}
