'use strict'

const {
  createStore, applyMiddleware, combineReducers, compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
const { intl, wizard } = require('../reducers')
const { debounce } = require('../middleware/debounce')

const dev = (ARGS.dev || ARGS.debug)

module.exports = {
  create(init = {}) {

    const reducer = combineReducers({
      wizard,
      intl
    })

    const middleware = applyMiddleware(
      debounce,
      thunk
    )
    const enhancer = (dev && window.devToolsExtension) ?
      compose(middleware, window.devToolsExtension()) :
      middleware

    const store = createStore(reducer, init, enhancer)

    return store
  }
}

