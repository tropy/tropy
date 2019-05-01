'use strict'

const {
  createStore, applyMiddleware, combineReducers, compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
const { default: createSagaMiddleware } = require('redux-saga')
const { error } = require('../common/log')
const { seq, debounce, throttle, log } = require('../middleware')

const {
  context,
  edit,
  flash,
  history,
  intl,
  keymap,
  ontology,
  prefs,
  project,
  settings
} = require('../reducers')


const devtools = (ARGS.dev || ARGS.debug) &&
  window.__REDUX_DEVTOOLS_EXTENSION__

module.exports = {
  create(init = {}) {
    let saga = createSagaMiddleware({
      onError(e) {
        error(`unhandled error in saga middleware: ${e.message}`, {
          stack: e.stack
        })
      }
    })

    let reducer = combineReducers({
      context,
      edit,
      flash,
      history,
      intl,
      keymap,
      ontology,
      prefs,
      project,
      settings
    })

    let middleware = applyMiddleware(
      debounce,
      throttle,
      thunk,
      seq,
      log,
      saga
    )

    if (typeof devtools === 'function') {
      middleware = compose(middleware, devtools())
    }

    return {
      ...createStore(reducer, init, middleware), saga
    }
  }
}
