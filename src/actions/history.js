'use strict'

const {
  UNDO, REDO, TICK, DROP, HISTORY
} = require('../constants/history')

const { omit } = require('../common/util')

module.exports = {

  undo(payload, meta) {
    return { type: UNDO, payload, meta: { ipc: HISTORY, ...meta } }
  },

  redo(payload, meta) {
    return { type: REDO, payload, meta: { ipc: HISTORY, ...meta } }
  },

  tick({ undo, redo }, meta) {
    undo.meta = omit(undo.meta, ['record'])
    redo.meta = omit(redo.meta, ['record'])

    return {
      type: TICK,
      payload: {
        undo,
        redo
      },
      meta: {
        ipc: HISTORY,
        ...meta
      }
    }
  },

  drop(payload, meta) {
    return { type: DROP, payload, meta: { ipc: HISTORY, ...meta } }
  }

}
