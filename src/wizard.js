'use strict'

const React = require('react')
const { render } = require('react-dom')
const { all } = require('bluebird')
const { ready, $ } = require('./dom')
const { create } = require('./stores/wizard')
const { Main } = require('./containers/main')
const { Wizard } = require('./containers/wizard')
const { getMessages } = require('./actions/intl')

const store = create()

all([
  store.dispatch(getMessages()),
  ready
])
  .then(() => {
    render(
      <Main store={store}><Wizard/></Main>,
      $('main')
    )
  })
