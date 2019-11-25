'use strict'

const React = require('react')
const { render } = require('../support/react')

describe('Toolbar', () => {
  const { Toolbar } = __require('components/toolbar')

  it('renders toolbar element', () => {
    expect(render(<Toolbar/>).element()).to.have.class('toobar')
  })
})
