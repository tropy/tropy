'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Steps', () => {
  const { Steps, Step } = __require('components/steps')

  it('has class steps', () => {
    expect(shallow(<Steps/>).hasClass('steps')).to.eql(true)
  })

  describe('Step', () => {
    it('has class step', () => {
      expect(shallow(<Step/>).hasClass('step')).to.eql(true)
    })
  })
})
