'use strict'

const React = require('react')
const { render } = require('react-dom')
const { all } = require('bluebird')
const { ready, $ } = require('../dom')
const { create } = require('../stores/project')
const { Main } = require('../components/main')
const { PrefsContainer } = require('../components/preferences')
const { intl, keymap } = require('../actions')
const { win } = require('../window')
const dialog = require('../dialog')

const store = create()
const { locale } = ARGS

all([
  store.dispatch(intl.load({ locale })),
  store.dispatch(keymap.load({ name: 'project', locale })),
  ready
])
  .then(() => {
    render(<Main store={store}><PrefsContainer/></Main>, $('.view'))
  })

dialog.start()

win.unloaders.push(dialog.stop)


if (ARGS.dev || ARGS.debug) {
  Object.defineProperty(window, 'store', { get: () => store })
  Object.defineProperty(window, 'state', { get: () => store.getState() })
}
