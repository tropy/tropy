'use strict'

const { combineReducers } = require('redux')
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

function sidebar(state = {}) {
  return state
}

module.exports = {
  ui: combineReducers({
    columns,
    sidebar
  })
}
