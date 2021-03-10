import { ipcRenderer as ipc } from 'electron'
import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
import thunk from 'redux-thunk'
import createSagaMiddleware from 'redux-saga'
import { fatal } from '../common/log'
import { seq, debounce, throttle, log } from '../middleware'

import {
  context,
  edit,
  flash,
  history,
  intl,
  keymap,
  ontology,
  prefs,
  project,
  settings
} from '../reducers'


export function create(init = {}) {
  let saga = createSagaMiddleware({
    onError(e) {
      fatal({ stack: e.stack }, 'unhandled error in saga middleware')
      ipc.send('error', e)
    }
  })

  let reducer = combineReducers({
    context,
    edit,
    flash,
    history,
    intl,
    keymap,
    ontology,
    prefs,
    project,
    settings
  })

  let middleware = applyMiddleware(
    debounce,
    throttle,
    thunk,
    seq,
    log,
    saga
  )

  let composeWithDevTools =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

  return {
    ...createStore(reducer, init, composeWithDevTools(middleware)), saga
  }
}
