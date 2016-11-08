'use strict'

const {
  INSERT, LOAD, REMOVE, UPDATE
} = require('../constants/photo')

const { omit } = require('../common/util')

module.exports = {
  photos(state = {}, { type, payload, error, meta }) {
    switch (type) {
      case LOAD:
        return (meta.done && !error) ? { ...state, ...payload } : state

      case INSERT:
        return { ...state, [payload.id]: payload }

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
