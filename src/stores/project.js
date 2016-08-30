'use strict'

const {
  createStore, applyMiddleware, combineReducers, compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
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

    const reducer = combineReducers({
      nav,
      project,
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

    ipc
      .on(OPEN, (_, file) => store.dispatch(open(file)))

    return store
  }
}
