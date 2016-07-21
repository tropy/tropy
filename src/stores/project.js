'use strict'

const {
  createStore, applyMiddleware, combineReducers, compose
} = require('redux')

const { default: thunk } = require('redux-thunk')
const { project } = require('../reducers/project')
const { intl } = require('../reducers/intl')
const { ipcRenderer: ipc } = require('electron')
const { open } = require('../actions/project')
const { OPEN } = require('../constants/project')

const dev = (ARGS.environment === 'development' || ARGS.debug)

module.exports = {
  create(init = {}) {

    const reducer = combineReducers({
      project,
      intl
    })

    const middleware = applyMiddleware(
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
