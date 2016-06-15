'use strict'

{
  const { createElement: create } = require('react')
  const { render } = require('react-dom')
  const { ready, $  } = require('../lib/dom')
  const Project = require('../lib/containers/project')

  ready(() => {
    render(create(Project), $('main'))
  })
}
