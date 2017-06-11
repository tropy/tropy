'use strict'

const React = require('react')
const { render } = require('react-dom')
const { all } = require('bluebird')
const { ready, $ } = require('../dom')
const { create } = require('../stores/project')
const { Main } = require('../components/main')
const { ProjectContainer } = require('../components/project')
const { main } = require('../sagas/project')
const { win } = require('../window')
const act = require('../actions')
const dialog = require('../dialog')

const store = create()
const tasks = store.saga.run(main)

const { locale, file } = ARGS

all([
  store.dispatch(act.intl.load({ locale })),
  store.dispatch(act.keymap.load({ name: 'project', locale })),
  ready
])
  .then(() => {
    store.dispatch(act.project.open(file))

    render(
      <Main store={store}><ProjectContainer/></Main>,
      $('.view')
    )
  })

dialog.start()

win.unloaders.push(dialog.stop)
win.unloaders.push(() => (
  store.dispatch(act.project.close()), tasks.done
))

if (ARGS.dev || ARGS.debug) {
  Object.defineProperty(window, 'store', { get: () => store })
  Object.defineProperty(window, 'state', { get: () => store.getState() })
}
