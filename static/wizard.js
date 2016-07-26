'use strict'

{
  const { createElement: element } = require('react')
  const { render } = require('react-dom')
  const { all } = require('bluebird')
  const { ready, $ } = require('../lib/dom')
  const { create } = require('../lib/stores/wizard')
  const { Main } = require('../lib/containers/main')
  const { Wizard } = require('../lib/components/wizard')
  const { getMessages } = require('../lib/actions/intl')

  const store = create()

  all([
    store.dispatch(getMessages()),
    ready
  ])
    .then(() => {
      render(
        element(Main, { store }, element(Wizard)),
        $('main')
      )
    })

}
