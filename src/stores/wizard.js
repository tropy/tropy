import {
  createStore, applyMiddleware, combineReducers
} from 'redux'

import thunk from 'redux-thunk'
import { flash, intl, wizard } from '../reducers'
import { debounce } from '../middleware'

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

  const store = createStore(reducer, init, middleware)

  return store
}
