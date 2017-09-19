'use strict'

const { PROJECT } = require('../constants')

module.exports = {
  project(state = {}, { type, payload }) {
    switch (type) {
      case PROJECT.OPENED:
        return { ...payload }
      case PROJECT.UPDATE:
        return { ...state, ...payload }
      case PROJECT.CLOSED:
        return {}
      default:
        return state
    }
  }
}
