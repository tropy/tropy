'use strict'

const {
  createStore, applyMiddleware, combineReducers, compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
const { wizard } = require('../reducers/wizard')
const { project } = require('../reducers/project')
const { intl } = require('../reducers/intl')

const dev = (ARGS.environment === 'development' || ARGS.debug)

module.exports = {
  create(init = {}) {

    const reducer = combineReducers({
      wizard,
      project,
      intl
    })

    const middleware = applyMiddleware(
      thunk
    )
    const enhancer = (dev && window.devToolsExtension) ?
      compose(middleware, window.devToolsExtension()) :
      middleware

    const store = createStore(reducer, init, enhancer)

    return store
  }
}

