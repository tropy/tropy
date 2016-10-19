'use strict'

const { combineReducers: combine } = require('redux')
const { CONTEXT, EDIT } = require('../constants/ui')

const cols = [
  { width: '40%', property: 'title' },
  { width: '25%', property: 'type' },
  { width: '15%', property: 'date' },
  {
    width: '10%',
    order: 'ascending',
    property: 'box'
  },
  { width: '10%', property: 'photos' }
]

function columns(state = cols) {
  return state
}

function context(state = {}, { type, payload }) {
  switch (type) {
    case CONTEXT.SHOW:
      return {
        [payload.scope]: payload.event.target
      }

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
    columns,
    context,
    edit
  })
}
