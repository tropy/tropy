'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Tree', () => {
  const { ListTree } = __require('components/list')

  it('renders all lists', () => {
    expect(
      shallow(<ListTree.WrappedComponent/>)
    ).not.to.have.descendants('ListNode')

    expect(
      shallow(
        <ListTree.WrappedComponent
          parent={{ children: [2, 1] }}
          lists={{
            1: { id: 1, name: 'A' },
            2: { id: 2, name: 'B' }
          }}/>
      )
    ).to.have.exactly(2).descendants('ListNode')
  })
})
