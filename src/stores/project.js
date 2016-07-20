'use strict'

const { createStore, applyMiddleware, combineReducers } = require('redux')
const { default: thunk } = require('redux-thunk')

const { project } = require('../reducers/project')
const { intl } = require('../reducers/intl')

const { getMessages } = require('../actions/intl')

module.exports = {
  create(init = {}) {
    const store = createStore(
      combineReducers({
        project,
        intl
      }),
      init,
      applyMiddleware(
        thunk
      )
    )

    store.dispatch(getMessages())

    return store
  }
}
