'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Wizard', () => {
  const { Wizard } = __require('components/wizard')

  it('has id wizard', () => {
    expect(shallow(<Wizard/>)).to.have.id('wizard')
  })

})

