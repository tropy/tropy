'use strict'

{
  const { createElement: element } = require('react')
  const { render } = require('react-dom')
  const { all } = require('bluebird')
  const { ready, $ } = require('../lib/dom')
  const { create } = require('../lib/stores/project')
  const { Main } = require('../lib/containers/main')
  const { Project } = require('../lib/components/project')
  const { getMessages } = require('../lib/actions/intl')
  const { open } = require('../lib/actions/project')

  const store = create()

  all([
    store.dispatch(getMessages()),
    store.dispatch(open(ARGS.file)),
    ready
  ])
    .then(() => {
      render(
        element(Main, { store }, element(Project)),
        $('main')
      )
    })
}
