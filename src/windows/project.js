'use strict'

const React = require('react')
const { render } = require('react-dom')
const { all } = require('bluebird')
const { ready, $ } = require('../dom')
const { create } = require('../stores/project')
const { Main } = require('../components/main')
const { ProjectContainer } = require('../components/project')
const { intl, project } = require('../actions')
const { main } = require('../sagas/project')
const { win } = require('../window')
const dialog = require('../dialog')

const store = create()
const tasks = store.saga.run(main)

all([
  store.dispatch(intl.getMessages()),
  store.dispatch(project.open(ARGS.file)),
  ready
])
  .then(() => {
    render(
      <Main store={store}><ProjectContainer/></Main>,
      $('#view')
    )
  })

dialog.start()

win.unloaders.push(dialog.stop)

win.unloaders.push(() => (
  store.dispatch(project.close()), tasks.done
))

if (ARGS.dev || ARGS.debug) {
  Object.defineProperty(window, 'store', { get: () => store })
  Object.defineProperty(window, 'state', { get: () => store.getState() })
}
