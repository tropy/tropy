'use strict'

const {
  createStore, applyMiddleware, combineReducers, compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
const { default: createSagaMiddleware } = require('redux-saga')
const { log: logger, warn, debug } = require('../common/log')
const { project } = require('../reducers/project')
const { nav } = require('../reducers/nav')
const { intl } = require('../reducers/intl')
const { history } = require('../reducers/history')
const { lists } = require('../reducers/lists')
const { activities } = require('../reducers/activity')
const { seq, debounce, log } = require('../middleware')

const dev = (ARGS.dev || ARGS.debug)

module.exports = {
  create(init = {}) {

    const saga = createSagaMiddleware({
      logger,
      onError: (error) => {
        warn(`unhandled error in saga middleware: ${error.message}`)
        debug(error.stack)
      }
    })

    const reducer = combineReducers({
      intl,
      nav,
      activities,
      project,
      lists,
      history
    })

    const middleware = applyMiddleware(
      debounce,
      thunk,
      seq,
      log,
      saga
    )

    const enhancer = (dev && window.devToolsExtension) ?
      compose(middleware, window.devToolsExtension()) :
      middleware

    const store = createStore(reducer, init, enhancer)

    return { ...store, saga }
  }
}
