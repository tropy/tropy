'use strict'

const {
  CREATE, REMOVE, UPDATE
} = require('../constants/list')

module.exports = {
  lists(state = {}, { type, payload }) {
    switch (type) {
      case CREATE:
        return { ...state, [payload.id]: payload }

      case REMOVE:
        return state

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
