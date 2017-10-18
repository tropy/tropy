'use strict'

const {
  applyMiddleware, createStore, combineReducers, compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
const { flash, intl } = require('../reducers')

const devtools = (ARGS.dev || ARGS.debug) &&
  window.__REDUX_DEVTOOLS_EXTENSION__

module.exports = {
  create(init = {}) {

    const reducer = combineReducers({
      flash,
      intl
    })

    let middleware = applyMiddleware(
      thunk
    )

    if (typeof devtools === 'function') {
      middleware = compose(middleware, devtools())
    }

    const store = createStore(reducer, init, middleware)

    return store
  }
}
