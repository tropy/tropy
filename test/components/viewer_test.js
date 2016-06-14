'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Viewer', () => {
  const { Viewer } = __require('components/viewer')
  const { Toolbar } = __require('components/toolbar')

  it('has id viewer', () => {
    expect(shallow(<Viewer/>)).to.have.id('viewer')
  })

  it('contains a Toolbar', () => {
    expect(shallow(<Viewer/>)).to.contain(<Toolbar/>)
  })
})
