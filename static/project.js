'use strict'

{
  const { createElement: element } = require('react')
  const { render } = require('react-dom')
  const { ready, $  } = require('../lib/dom')
  const { create } = require('../lib/stores/project')
  const { Provider } = require('../lib/containers/provider')
  const { Project } = require('../lib/containers/project')
  const { getMessages } = require('../lib/actions/intl')

  const store = create()
  store.dispatch(getMessages())

  ready(() => {
    render(
      element(Provider, { store }, element(Project)),
      $('main')
    )
  })
}
