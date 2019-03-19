'use strict'

const { CONTEXT } = require('../constants')

module.exports = {
  context(state = {}, { type, payload }) {
    switch (type) {
      case CONTEXT.CLEAR:
        return {}
      case CONTEXT.SHOW:
        return payload
      default:
        return state
    }
  }
}
