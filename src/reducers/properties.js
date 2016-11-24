'use strict'

const { PROPERTIES } = require('../constants')
const init = {}

module.exports = {
  properties(state = init, { type, payload }) {
    switch (type) {
      case PROPERTIES.RESTORE:
        return { ...init, ...payload }

      case PROPERTIES.UPDATE:
        return { ...state, ...payload }
      default:
        return state
    }
  }
}
