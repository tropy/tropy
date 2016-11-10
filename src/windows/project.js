'use strict'

const React = require('react')
const { render } = require('react-dom')
const { all } = require('bluebird')
const { ready, $ } = require('../dom')
const { create } = require('../stores/project')
const { Main } = require('../components/main')
const { Project } = require('../components/project')
const { getMessages } = require('../actions/intl')
const { open } = require('../actions/project')
const { main } = require('../sagas/project')
const { unloaders } = require('../window')

const store = create()
const tasks = store.saga.run(main)

all([
  store.dispatch(getMessages()),
  store.dispatch(open(ARGS.file)),
  ready
])
  .then(() => {
    render(
      <Main store={store}><Project/></Main>,
      $('#view')
    )
  })

unloaders.push(() => (tasks.cancel(), tasks.done))

if (ARGS.dev || ARGS.debug) {
  Object.defineProperty(window, 'store', { get: () => store })
  Object.defineProperty(window, 'state', { get: () => store.getState() })
}
