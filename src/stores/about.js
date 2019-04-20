'use strict'

const {
  applyMiddleware,
  createStore,
  combineReducers,
  compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
const { intl } = require('../reducers/intl')
const { flash } = require('../reducers/flash')

const devtools = (ARGS.dev || ARGS.debug) &&
  window.__REDUX_DEVTOOLS_EXTENSION__

module.exports = {
  create(init = {}) {
    let reducer = combineReducers({
      flash,
      intl
    })

    let middleware = applyMiddleware(
      thunk
    )

    if (typeof devtools === 'function') {
      middleware = compose(middleware, devtools())
    }

    return createStore(reducer, init, middleware)
  }
}
