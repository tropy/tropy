'use strict'

const { combineReducers: combine } = require('redux')
const { LIST, UI } = require('../constants')

function editable(state = {}, { type, payload }) {
  switch (type) {
    case LIST.NEW:
      return { list: payload }

    case UI.EDITABLE.CANCEL:
      return {}

    default:
      return state
  }
}

module.exports = {
  ui: combine({
    editable
  })
}
