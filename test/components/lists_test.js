'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Lists', () => {
  const { Lists } = __require('components/lists')

  it('renders all lists', () => {
    expect(
      shallow(
        <Lists.WrappedComponent lists={[]}/>
      )
    ).not.to.have.descendants('List')

    expect(
      shallow(
        <Lists.WrappedComponent lists={[
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]}/>
      )
    ).to.have.exactly(2).descendants('List')
  })
})
