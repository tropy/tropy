'use strict'

const React = require('react')
const { render } = require('../support/react')

describe('Steps', () => {
  const { Steps, Step } = __require('components/steps')

  it('renders .steps container', () => {
    expect(render(<Steps/>).element()).to.have.class('steps')
  })

  describe('Step', () => {
    it('renders .step container', () => {
      expect(render(<Step/>).element()).to.have.class('step')
    })
  })
})
