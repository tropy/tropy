'use strict'

const React = require('react')
const { shallow, render } = require('enzyme')

describe('Icon', () => {
  const { Icon } = __require('components/icons')

  it('renders an .icon', () => {
    expect(shallow(<Icon/>)).to.have.className('icon')
  })
})

describe('IconFolder', () => {
  const { IconFolder } = __require('components/icons')

  it('renders an .icon.icon-folder', () => {
    expect(render(<IconFolder/>)).to.have.className('icon icon-folder')
  })
})
