'use strict'

const {
  UNDO, REDO, TICK, DROP, CHANGED
} = require('../constants/history')

const { omit } = require('../common/util')

module.exports = {
  undo(payload, meta) {
    return { type: UNDO, payload, meta: { ipc: CHANGED, ...meta } }
  },

  redo(payload, meta) {
    return { type: REDO, payload, meta: { ipc: CHANGED, ...meta } }
  },

  tick({ undo, redo }, mode = 'add', meta) {
    undo.meta = omit(undo.meta, ['history'])
    redo.meta = omit(redo.meta, ['history'])

    return {
      type: TICK,
      payload: { undo, redo },
      meta: {
        ipc: CHANGED, mode, ...meta
      }
    }
  },

  drop(payload, meta) {
    return { type: DROP, payload, meta: { ipc: CHANGED, ...meta } }
  }
}
