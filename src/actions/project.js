'use strict'

const {
  OPEN, OPENED, UPDATE, SAVE
} = require('../constants/project')

function opened(payload, meta) {
  return { type: OPENED, error: (payload instanceof Error), payload, meta }
}

function open(payload, meta) {
  return { type: OPEN, payload, meta }
}

function save(payload) {
  return { type: SAVE, payload }
}

function update(payload, meta) {
  return { type: UPDATE, payload, meta }
}

module.exports = {
  open,
  opened,
  save,
  update
}
