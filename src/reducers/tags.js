'use strict'

const {
  INSERT, LOAD, REMOVE, UPDATE
} = require('../constants/tag')

const { omit } = require('../common/util')
const { into, map } = require('transducers.js')

module.exports = {
  tags(state = {}, { type, payload, error, meta }) {
    switch (type) {
      case LOAD:
        return (meta.done && !error) ?
          into({ ...state }, map(tag => [tag.id, tag]), payload) :
          {}

      case INSERT:
        return {
          ...state,
          [payload.id]: payload
        }

      case REMOVE:
        return omit(state, [payload])

      case UPDATE:
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
