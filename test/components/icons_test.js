'use strict'

const React = require('react')
const { render } = require('@testing-library/react')
const { Icon, IconFolder } = __require('components/icons')

describe('Icon', () => {
  it('renders an .icon', () => {
    const { container } = render(<Icon/>)
    expect(container.firstChild.classList.contains('icon')).to.be.true
  })
})

describe('IconFolder', () => {
  it('renders an .icon.icon-folder', () => {
    const { container } = render(<IconFolder/>)
    expect(container.firstChild).to.have.class('icon')
    expect(container.firstChild).to.have.class('icon-folder')
  })
})
