'use strict'

const {
  createStore, applyMiddleware, combineReducers, compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
const { default: createSagaMiddleware } = require('redux-saga')
const { log } = require('../common/log')
const { project } = require('../reducers/project')
const { nav } = require('../reducers/nav')
const { intl } = require('../reducers/intl')
const { ipcRenderer: ipc } = require('electron')
const { open } = require('../actions/project')
const { OPEN } = require('../constants/project')
const { debounce } = require('../middleware/debounce')

const dev = (ARGS.dev || ARGS.debug)

module.exports = {
  create(init = {}) {

    const saga = createSagaMiddleware({ logger: log })

    const reducer = combineReducers({
      nav,
      project,
      intl
    })

    const middleware = applyMiddleware(
      debounce,
      thunk,
      saga
    )
    const enhancer = (dev && window.devToolsExtension) ?
      compose(middleware, window.devToolsExtension()) :
      middleware

    const store = createStore(reducer, init, enhancer)

    ipc
      .on(OPEN, (_, file) => store.dispatch(open(file)))

    return { ...store, saga }
  }
}
