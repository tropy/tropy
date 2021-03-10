import {
  applyMiddleware,
  createStore,
  combineReducers
} from 'redux'

import thunk from 'redux-thunk'
import { intl } from '../reducers'

export function create(init = {}) {
  let reducer = combineReducers({
    intl
  })

  let middleware = applyMiddleware(
    thunk
  )

  return createStore(reducer, init, middleware)
}
