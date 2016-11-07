'use strict'

const { omit } = require('../common/util')

const {
  INSERT, LOAD, REMOVE, UPDATE
} = require('../constants/item')

module.exports = {
  items(state = {}, { type, payload, meta, error }) {
    switch (type) {
      case LOAD:
        return (meta.done && !error) ?
          { ...state, ...payload } : state

      case INSERT:
        return {
          ...state,
          [payload.id]: payload
        }

      case REMOVE:
        return omit(state, payload)

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
