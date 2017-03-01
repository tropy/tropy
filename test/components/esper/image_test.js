'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('EsperImage', () => {
  const { EsperImage } = __require('components/esper/image')

  it('has class esper', () => {
    expect(shallow(<EsperImage/>)).to.have.className('esper')
  })

})
