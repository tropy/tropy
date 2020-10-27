import {
  createStore, applyMiddleware, combineReducers, compose
} from 'redux'

import thunk from 'redux-thunk'
import ARGS from '../args'
import { flash, intl, wizard } from '../reducers'
import { debounce } from '../middleware'

const devtools = (ARGS.dev || ARGS.debug) &&
  window.__REDUX_DEVTOOLS_EXTENSION__

export function create(init = {}) {

  const reducer = combineReducers({
    flash,
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
