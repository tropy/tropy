'use strict'

const { combineReducers: combine } = require('redux')
const { CONTEXT, EDIT, ITEMS } = require('../constants/ui')
const { DC } = require('../constants/properties')

const cols = [
  { width: '40%', property: DC.TITLE },
  { width: '25%', property: DC.TYPE },
  { width: '20%', property: DC.DATE },
  { width: '15%', property: DC.RIGHTS }
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

function items(state = [], { type, payload }) {
  switch (type) {
    case ITEMS.UPDATE:
      return [...payload]

    default:
      return state
  }
}

module.exports = {
  ui: combine({
    columns,
    context,
    edit,
    items
  })
}
