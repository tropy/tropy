'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Tree', () => {
  const { ListTree } = __require('components/list')

  it('renders all lists', () => {
    expect(
      shallow(
        <ListTree.WrappedComponent lists={[]}/>
      )
    ).not.to.have.descendants('ListNode')

    expect(
      shallow(
        <ListTree.WrappedComponent lists={[
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]}/>
      )
    ).to.have.exactly(2).descendants('ListNode')
  })
})
