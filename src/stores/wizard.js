'use strict'

const {
  createStore, applyMiddleware, combineReducers, compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
const { intl, wizard } = require('../reducers')
const { debounce } = require('../middleware/debounce')

const devtools = (ARGS.dev || ARGS.debug) &&
  window.__REDUX_DEVTOOLS_EXTENSION__

module.exports = {
  create(init = {}) {

    const reducer = combineReducers({
      wizard,
      intl
    })

    let middleware = applyMiddleware(
      debounce,
      thunk
    )

    if (typeof devtools === 'function') {
      middleware = compose(middleware, devtools())
    }

    const store = createStore(reducer, init, middleware)

    return store
  }
}
