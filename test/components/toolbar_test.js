'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe.skip('Toolbar', () => {
  const { Toolbar } = __require('components/toolbar')

  it('has class toolbar', () => {
    expect(shallow(<Toolbar/>)).to.have.className('toolbar')
  })

})
