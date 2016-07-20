'use strict'

const { createStore, applyMiddleware, combineReducers } = require('redux')
const { default: thunk } = require('redux-thunk')
const { project } = require('../reducers/project')
const { intl } = require('../reducers/intl')

module.exports = {
  create(init = {}) {
    return createStore(
      combineReducers({
        project,
        intl
      }),
      init,
      applyMiddleware(
        thunk
      )
    )
  }
}
