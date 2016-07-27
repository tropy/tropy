'use strict'

const React = require('react')
const { shallow } = require('enzyme')
const { intl } = require('../support/intl')

describe('Wizard', () => {
  const { Wizard } = __require('components/wizard')

  let update
  let submit

  beforeEach(() => {
    update = sinon.spy()
    submit = sinon.spy()
  })

  it('has id wizard', () => {
    expect(shallow(
      <Wizard
        update={update}
        submit={submit}
        project={{ name: 'tropy' }}
        intl={intl}/>

    )).to.have.id('wizard')
  })

})

