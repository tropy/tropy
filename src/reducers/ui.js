'use strict'

const { combineReducers: combine } = require('redux')
const { EDIT } = require('../constants/ui')

function edit(state = {}, { type, payload }) {
  switch (type) {
    case EDIT.START:
      return { ...payload }

    case EDIT.CANCEL:
      return {}

    default:
      return state
  }
}

module.exports = {
  ui: combine({
    edit
  })
}
