import { ipcRenderer as ipc } from 'electron'
import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
import thunk from 'redux-thunk'
import createSagaMiddleware from 'redux-saga'
import { fatal } from '../common/log'
import { seq, debounce, throttle, log } from '../middleware'

import {
  activities,
  context,
  edit,
  esper,
  flash,
  history,
  imports,
  intl,
  items,
  keymap,
  lists,
  metadata,
  nav,
  notes,
  notepad,
  ontology,
  panel,
  photos,
  project,
  qr,
  recent,
  selections,
  settings,
  sidebar,
  tags,
  ui
} from '../reducers'

export function create(init = {}) {

  let saga = createSagaMiddleware({
    onError(e) {
      fatal({ stack: e.stack }, 'unhandled error in saga middleware')
      ipc.send('error', e)
    }
  })

  let reducer = combineReducers({
    activities,
    context,
    edit,
    esper,
    flash,
    history,
    imports,
    intl,
    items,
    keymap,
    lists,
    metadata,
    nav,
    notes,
    notepad,
    ontology,
    panel,
    photos,
    project,
    qr,
    recent,
    selections,
    settings,
    sidebar,
    tags,
    ui
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
