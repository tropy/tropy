'use strict'

const {
  createStore, applyMiddleware, combineReducers, compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
const { default: createSagaMiddleware } = require('redux-saga')
const { log: logger } = require('../common/log')
const { project } = require('../reducers/project')
const { nav } = require('../reducers/nav')
const { intl } = require('../reducers/intl')
const { history } = require('../reducers/history')
const { debounce, log } = require('../middleware')

const dev = (ARGS.dev || ARGS.debug)

module.exports = {
  create(init = {}) {

    const saga = createSagaMiddleware({ logger })

    const reducer = combineReducers({
      nav,
      project,
      intl,
      history
    })

    const middleware = applyMiddleware(
      debounce,
      log,
      thunk,
      saga
    )

    const enhancer = (dev && window.devToolsExtension) ?
      compose(middleware, window.devToolsExtension()) :
      middleware

    const store = createStore(reducer, init, enhancer)

    return { ...store, saga }
  }
}
