'use strict'

const { TAG } = require('../constants')
const { omit } = require('../common/util')
const { into, map } = require('transducers.js')

module.exports = {
  tags(state = {}, { type, payload, error, meta }) {
    switch (type) {
      case TAG.LOAD:
        return (meta.done && !error) ?
          into({ ...state }, map(tag => [tag.id, tag]), payload) :
          {}

      case TAG.INSERT:
        return {
          ...state,
          [payload.id]: payload
        }

      case TAG.REMOVE:
        return omit(state, [payload])

      case TAG.UPDATE:
        return {
          ...state,
          [payload.id]: {
            ...state[payload.id],
            ...payload
          }
        }

      default:
        return state
    }
  }
}
