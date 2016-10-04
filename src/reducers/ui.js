'use strict'

const { combineReducers: combine } = require('redux')
const { CONTEXT, EDIT } = require('../constants/ui')

function context(state = {}, { type, payload }) {
  switch (type) {
    case CONTEXT.SHOW:
      return { ...payload }

    case CONTEXT.CLEAR:
      return {}

    default:
      return state
  }
}

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
    context,
    edit
  })
}
