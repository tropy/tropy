'use strict'

const {
  UNDO, REDO, DROP, TICK, MERGE
} = require('../constants/history')


module.exports = {
  history(state = { past: [], future: [] }, { type, payload }) {
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
      case MERGE:
        if (state.past.length) {
          const { undo } = state.past[0]

          if (undo.type === payload.undo.type) {
            return {
              past: [{ ...payload, undo }, ...state.past.slice(1)],
              future: []
            }
          }
        }
        // eslint-disable-line no-fallthrough
      case TICK:
        return {
          past: [payload, ...state.past],
          future: []
        }
      case DROP:
        return {
          past: [],
          future: []
        }
      default:
        return state
    }
  }
}
