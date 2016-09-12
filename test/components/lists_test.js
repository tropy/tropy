'use strict'

const React = require('react')
const { mount } = require('../support/intl')

describe('Lists', () => {
  const { Lists } = __require('components/lists')

  it('renders all lists', () => {
    expect(
      mount(
        <Lists.WrappedComponent lists={[]}/>
      )
    ).not.to.have.descendants('.list')

    expect(
      mount(
        <Lists.WrappedComponent lists={[
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]}/>
      )
    ).to.have.exactly(2).descendants('.list')
  })
})
