'use strict'

{
  const { createElement: create } = require('react')
  const { render } = require('react-dom')
  const { ready, $  } = require('../lib/dom')
  const Project = require('../lib/components/project')

  ready(() => {
    render(create(Project), $('main'))
  })
}
