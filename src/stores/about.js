import {
  applyMiddleware,
  createStore,
  combineReducers
} from 'redux'

import thunk from 'redux-thunk'
import { flash, intl } from '../reducers'

export function create(init = {}) {
  let reducer = combineReducers({
    flash,
    intl
  })

  let middleware = applyMiddleware(
    thunk
  )

  return createStore(reducer, init, middleware)
}
