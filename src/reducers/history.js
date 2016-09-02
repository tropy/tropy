'use strict'

const { DROP, TICK } = require('../constants/history')

const init = { past: [], future: [] }

module.exports = {
  history(state = init, { type, payload }) {
    switch (type) {

      case TICK:
        return { ...state, past: [payload, ...state.past] }

      case DROP:
        return init

      default:
        return state
    }
  }
}
