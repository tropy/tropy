'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Panels', () => {
  const { Panels } = __require('components/panels')

  it('has id items', () => {
    expect(shallow(<Panels/>)).to.have.id('panels')
  })

})
