'use strict'

const React = require('react')
const { render } = require('react-dom')
const { all } = require('bluebird')
const { ready, $ } = require('../dom')
const { create } = require('../stores/about')
const { Main } = require('../components/main')
const { About } = require('../components/about')
const act = require('../actions')

const store = create()
const { locale } = ARGS

all([
  store.dispatch(act.intl.load({ locale })),
  ready
])
  .then(() => {
    render(<Main store={store}><About/></Main>, $('main'))
  })

if (ARGS.dev || ARGS.debug) {
  Object.defineProperty(window, 'store', { get: () => store })
  Object.defineProperty(window, 'state', { get: () => store.getState() })
}
