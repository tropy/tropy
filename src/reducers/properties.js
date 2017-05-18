'use strict'

const { PROPERTIES } = require('../constants')

module.exports = {
  properties(state = {}, { type, payload }) {
    switch (type) {
      case PROPERTIES.RESTORE:
        return {}
      case PROPERTIES.UPDATE:
        return { ...state, ...payload }
      default:
        return state
    }
  }
}
