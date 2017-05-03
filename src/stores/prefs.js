'use strict'

const {
  createStore, applyMiddleware, combineReducers, compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
const { seq, debounce, throttle, log } = require('../middleware')

const {
  intl,
  properties,
  project,
  keymap,
  history
} = require('../reducers')


const devtools = (ARGS.dev || ARGS.debug) &&
  window.__REDUX_DEVTOOLS_EXTENSION__

module.exports = {
  create(init = {}) {
    let reducer = combineReducers({
      intl,
      properties,
      project,
      keymap,
      history
    })

    let middleware = applyMiddleware(
      debounce,
      throttle,
      thunk,
      seq,
      log
    )

    if (typeof devtools === 'function') {
      middleware = compose(middleware, devtools())
    }

    return {
      ...createStore(reducer, init, middleware)
    }
  }
}
