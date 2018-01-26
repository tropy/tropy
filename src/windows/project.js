'use strict'

const { all } = require('../common/promisify')
const React = require('react')
const { render } = require('react-dom')
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
      $('main')
    )
  })

dialog.start(store)

win.on('app.undo', () => {
  store.dispatch(act.history.undo())
})
win.on('app.redo', () => {
  store.dispatch(act.history.redo())
})
win.on('settings.update', (settings) => {
  store.dispatch(act.settings.update(settings))
  if (settings.locale) {
    store.dispatch(act.intl.load({ locale: settings.locale }))
  }
})

win.unloaders.push(dialog.stop)
win.unloaders.push(() => (
  store.dispatch(act.project.close()), tasks.done
))

if (ARGS.dev || ARGS.debug) {
  Object.defineProperty(window, 'store', { get: () => store })
  Object.defineProperty(window, 'state', { get: () => store.getState() })
}
