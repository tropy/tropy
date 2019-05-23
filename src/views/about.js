'use strict'

const React = require('react')
const { render } = require('react-dom')
const { create } = require('../stores/about')
const { Main } = require('../components/main')
const { About } = require('../components/about')
const { load } = require('../actions/intl')
const { win } = require('../window')

const store = create()
const { locale } = ARGS

store
  .dispatch(load({ locale }))
  .then(() => {
    render(
      <Main store={store} window={win}>
        <About/>
      </Main>,
      document.getElementById('main'))
  })

Object.defineProperty(window, 'store', { get: () => store })
Object.defineProperty(window, 'state', { get: () => store.getState() })
