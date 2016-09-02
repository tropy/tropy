'use strict'

const {
  UNDO, REDO, TICK, DROP, HISTORY
} = require('../constants/history')

function undo(payload, meta) {
  return { type: UNDO, payload, meta: { ipc: HISTORY, ...meta } }
}

function redo(payload, meta) {
  return { type: REDO, payload, meta: { ipc: HISTORY, ...meta } }
}

function tick(payload, meta) {
  payload.redo.meta.history = false
  payload.undo.meta.history = false

  return {
    type: TICK,
    payload,
    meta: {
      ipc: HISTORY,
      ...meta
    }
  }
}

function drop(payload, meta) {
  return { type: DROP, payload, meta: { ipc: HISTORY, ...meta } }
}

module.exports = {
  undo, redo, tick, drop
}
