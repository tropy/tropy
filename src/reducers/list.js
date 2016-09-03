'use strict'

const {
  CREATE
} = require('../constants/list')

module.exports = {
  lists(state = {}, { type, payload }) {
    switch (type) {
      case CREATE:
        return { ...state, [payload.id]: payload }

      default:
        return state
    }
  }
}
