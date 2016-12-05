'use strict'

const React = require('react')
const { shallow } = require('enzyme')
const { intl } = require('../support/intl')

describe('Wizard', () => {
  const {
    Wizard: { WrappedComponent: { WrappedComponent: Wizard } }
  } = __require('components/wizard')

  let submit

  beforeEach(() => {
    submit = sinon.spy()
  })

  it('has id wizard', () => {
    expect(shallow(
      <Wizard
        onSubmit={submit}
        intl={intl}/>

    )).to.have.id('wizard')
  })

})

