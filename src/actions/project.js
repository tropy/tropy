'use strict'

const {
  OPEN, OPENED, PERSIST, UPDATE
} = require('../constants/project')

function opened(payload, meta) {
  return {
    type: OPENED,
    error: (payload instanceof Error),
    payload,
    meta: { ipc: true, ...meta }
  }
}

function open(payload, meta) {
  return { type: OPEN, payload, meta }
}

function persist(payload, meta) {
  return {
    type: PERSIST,
    payload,
    meta: {
      persist: true,
      history: true,
      ...meta
    }
  }
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
