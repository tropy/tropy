'use strict'

const {
  OPEN, OPENED, PERSIST, UPDATE
} = require('../constants/project')

function opened(payload, meta) {
  return {
    type: OPENED,
    error: (payload instanceof Error),
    payload,
    meta: { ...meta, ipc: true }
  }
}

function open(payload, meta) {
  return { type: OPEN, payload, meta }
}

function persist(payload, meta) {
  return { type: PERSIST, payload, meta: { ...meta, persist: true } }
}

function update(payload, meta) {
  return { type: UPDATE, payload, meta }
}

module.exports = {
  open,
  opened,
  persist,
  update
}
