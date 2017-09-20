'use strict'

const React = require('react')
const { render } = require('react-dom')
const { all } = require('bluebird')
const { ready, $ } = require('../dom')
const { create } = require('../stores/wizard')
const { Main } = require('../components/main')
const { WizardContainer } = require('../components/wizard')
const act = require('../actions')
const { win } = require('../window')
const dialog = require('../dialog')

const store = create()

const { locale } = ARGS

all([
  store.dispatch(act.intl.load({ locale })),
  ready
])
  .then(() => {
    render(
      <Main store={store}><WizardContainer/></Main>,
      $('main')
    )
  })

dialog.start(store)
win.unloaders.push(dialog.stop)

win.on('app.undo', () => {
  store.dispatch(act.history.undo())
})
win.on('app.redo', () => {
  store.dispatch(act.history.redo())
})
win.on('settings.update', (settings) => {
  store.dispatch(act.settings.update(settings))
})

if (ARGS.dev || ARGS.debug) {
  Object.defineProperty(window, 'store', { get: () => store })
  Object.defineProperty(window, 'state', { get: () => store.getState() })
}
