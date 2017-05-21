'use strict'

const React = require('react')
const { render } = require('react-dom')
const { all } = require('bluebird')
const { ready, $ } = require('../dom')
const { create } = require('../stores/wizard')
const { Main } = require('../components/main')
const { WizardContainer } = require('../components/wizard')
const { intl } = require('../actions')
const { win } = require('../window')
const dialog = require('../dialog')

const store = create()

const { locale } = ARGS

all([
  store.dispatch(intl.load({ locale })),
  ready
])
  .then(() => {
    render(
      <Main store={store}><WizardContainer/></Main>,
      $('main')
    )

    win.show()
  })

dialog.start()
win.unloaders.push(dialog.stop)

if (ARGS.dev || ARGS.debug) {
  Object.defineProperty(window, 'store', { get: () => store })
  Object.defineProperty(window, 'state', { get: () => store.getState() })
}
