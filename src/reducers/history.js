'use strict'

const {
  UNDO, REDO, DROP, TICK
} = require('../constants/history')

const init = { past: [], future: [] }

module.exports = {
  history(state = init, { type, payload }) {
    switch (type) {

      case UNDO:
        return {
          past: state.past.slice(1),
          future: [state.past[0], ...state.future]
        }

      case REDO:
        return {
          past: [state.future[0], ...state.past],
          future: state.future.slice(1)
        }

      case TICK:
        return {
          past: [payload, ...state.past],
          future: []
        }

      case DROP:
        return init

      default:
        return state
    }
  }
}
