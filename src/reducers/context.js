'use strict'

const { CONTEXT } = require('../constants')

module.exports = {
  context(state = {}, { type, payload }) {
    switch (type) {
      case CONTEXT.SHOW: {
        const { scope, event } = payload

        return {
          [scope]: event.target
        }
      }

      case CONTEXT.CLEAR:
        return {}

      default:
        return state
    }
  }
}
