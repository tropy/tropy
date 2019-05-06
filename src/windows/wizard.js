'use strict'

const React = require('react')
const { render } = require('react-dom')
const { create } = require('../stores/wizard')
const { Main } = require('../components/main')
const { WizardContainer } = require('../components/wizard')
const { win } = require('../window')
const dialog = require('../dialog')
const intl = require('../actions/intl')
const history = require('../actions/history')
const settings = require('../actions/settings')

const store = create()
const { locale } = ARGS

store
  .dispatch(intl.load({ locale }))
  .then(() => {
    render(
      <Main store={store}><WizardContainer/></Main>,
      document.getElementById('main'))
  })

dialog.start(store)
win.unloaders.push(dialog.stop)

win.on('app.undo', () => {
  store.dispatch(history.undo())
})
win.on('app.redo', () => {
  store.dispatch(history.redo())
})
win.on('settings.update', (data) => {
  store.dispatch(settings.update(data))
})

Object.defineProperty(window, 'store', { get: () => store })
Object.defineProperty(window, 'state', { get: () => store.getState() })
