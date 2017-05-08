'use strict'

const React = require('react')
const { render } = require('react-dom')
const { all } = require('bluebird')
const { ready, $ } = require('../dom')
const { create } = require('../stores/prefs')
const { Main } = require('../components/main')
const { PrefsContainer } = require('../components/prefs')
const { win } = require('../window')
const act = require('../actions')
const dialog = require('../dialog')

const store = create()
const { locale } = ARGS

all([
  store.dispatch(act.vocab.load('dc')),
  store.dispatch(act.vocab.load('dcterms')),
  store.dispatch(act.vocab.load('edm')),
  store.dispatch(act.vocab.load('skos')),
  store.dispatch(act.vocab.load('foaf')),
  store.dispatch(act.vocab.load('rdf')),
  store.dispatch(act.vocab.load('rdfs')),
  store.dispatch(act.intl.load({ locale })),
  store.dispatch(act.keymap.load({ name: 'project', locale })),
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
