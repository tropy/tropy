'use strict'

const React = require('react')
const { render } = require('../support/react')

describe('IconTropy', () => {
  const { IconTropy } = __require('components/icons')

  it('renders an .icon.icon-tropy', () => {
    expect(render(<IconTropy/>).element())
      .to.have.class('icon')
      .and.class('icon-tropy')
  })
})
