'use strict'

const {
  createStore, applyMiddleware, combineReducers, compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
const { seq, debounce, throttle, log } = require('../middleware')

const {
  intl,
  edit,
  prefs,
  properties,
  project,
  keymap,
  history,
  vocab
} = require('../reducers')


const devtools = (ARGS.dev || ARGS.debug) &&
  window.__REDUX_DEVTOOLS_EXTENSION__

module.exports = {
  create(init = {}) {
    let reducer = combineReducers({
      intl,
      edit,
      prefs,
      properties,
      project,
      keymap,
      history,
      vocab
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
