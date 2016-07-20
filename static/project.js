'use strict'

{
  const { createElement: element } = require('react')
  const { render } = require('react-dom')
  const { ready, $ } = require('../lib/dom')
  const { create } = require('../lib/stores/project')
  const { Provider } = require('../lib/containers/provider')
  const { Project } = require('../lib/components/project')
  const { getMessages } = require('../lib/actions/intl')
  const { open } = require('../lib/actions/project')

  const store = create()

  store.dispatch(getMessages())
  store.dispatch(open(ARGS.file))

  ready(() => {
    render(
      element(Provider, { store }, element(Project)),
      $('main')
    )
  })
}
