'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Esper', () => {
  const { Esper } = __require('components/esper/esper')

  it('has class esper', () => {
    expect(shallow(<Esper/>)).to.have.className('esper')
  })

})
