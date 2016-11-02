'use strict'

const { omit } = require('../common/util')

const {
  INSERT, REMOVE, UPDATE
} = require('../constants/item')

module.exports = {
  items(state = {}, { type, payload }) {
    switch (type) {

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
