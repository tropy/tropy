'use strict'

const React = require('react')
const { shallow, render } = require('enzyme')

describe('Icon', () => {
  const { Icon } = __require('components/icons')

  it('renders an .icon', () => {
    expect(shallow(<Icon/>)).to.have.className('icon')
  })

  it('accepts extra classes', () => {
    expect(shallow(<Icon classes={{ foo: true, bar: false }}/>))
      .to.have.className('icon foo')
  })
})

describe('IconFolder', () => {
  const { IconFolder } = __require('components/icons')

  it('renders an .icon.icon-folder', () => {
    expect(render(<IconFolder/>)).to.have.className('icon icon-folder')
  })
})
