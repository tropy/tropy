'use strict'

const {
  UNDO, REDO, TICK, DROP
} = require('../constants/history')

function undo(payload, meta) {
  return { type: UNDO, payload, meta }
}

function redo(payload, meta) {
  return { type: REDO, payload, meta }
}

function tick(payload, meta) {
  return { type: TICK, payload, meta: { ipc: true, ...meta } }
}

function drop(payload, meta) {
  return { type: DROP, payload, meta }
}

module.exports = {
  undo, redo, tick, drop
}
