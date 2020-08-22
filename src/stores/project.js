import {
  createStore,
  applyMiddleware,
  combineReducers,
  compose
} from 'redux'

import thunk from 'redux-thunk'
import createSagaMiddleware from 'redux-saga'
import { error } from '../common/log'
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

const devtools = (ARGS.dev || ARGS.debug) &&
  window.__REDUX_DEVTOOLS_EXTENSION__

export function create(init = {}) {

  let saga = createSagaMiddleware({
    onError(e) {
      error({ stack: e.stack }, 'unhandled error in saga middleware')
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

  if (typeof devtools === 'function') {
    middleware = compose(middleware, devtools())
  }

  return {
    ...createStore(reducer, init, middleware), saga
  }
}
