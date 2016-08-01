'use strict'

const React = require('react')
const { render } = require('react-dom')
const { all } = require('bluebird')
const { ready, $ } = require('./dom')
const { create } = require('./stores/project')
const { Main } = require('./containers/main')
const { Project } = require('./components/project')
const { getMessages } = require('./actions/intl')
const { open, close } = require('./actions/project')
const { unloaders } = require('./window')

const store = create()

all([
  store.dispatch(getMessages()),
  store.dispatch(open(ARGS.file)),
  ready
])
  .then(() => {
    render(
      <Main store={store}><Project/></Main>,
      $('main')
    )
  })

unloaders.push(() => store.dispatch(close()))
