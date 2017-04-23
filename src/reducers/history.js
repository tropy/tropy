'use strict'

const {
  UNDO, REDO, DROP, TICK
} = require('../constants/history')


function canMerge(a, b) {
  return a.type === b.type && a.payload.id === b.payload.id
}

module.exports = {
  history(state = { past: [], future: [] }, { type, payload, meta }) {
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
        if (meta.mode === 'merge' && state.past.length) {
          const { undo } = state.past[0]

          if (canMerge(undo, payload.undo)) {
            return {
              past: [{ ...payload, undo }, ...state.past.slice(1)],
              future: []
            }
          }
        }

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
