import {
  applyMiddleware,
  createStore,
  combineReducers,
  compose
} from 'redux'

import thunk from 'redux-thunk'
import { intl } from '../reducers'

const devtools = (ARGS.dev || ARGS.debug) &&
  window.__REDUX_DEVTOOLS_EXTENSION__

export function create(init = {}) {
  let reducer = combineReducers({
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
