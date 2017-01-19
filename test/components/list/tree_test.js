'use strict'

const React = require('react')
const { render } = require('enzyme')
const dnd = require('../../support/dnd')

describe('Tree', () => {
  const ListTree = dnd.wrap(__require('components/list').ListTree)

  it('renders all lists', () => {
    expect(
      render(<ListTree/>)
    ).not.to.have.descendants('.list')

    expect(
      render(
        <ListTree
          parent={{ children: [2, 1] }}
          lists={{
            1: { id: 1, name: 'A' },
            2: { id: 2, name: 'B' }
          }}/>
      )
    ).to.have.exactly(2).descendants('.list')
  })
})
