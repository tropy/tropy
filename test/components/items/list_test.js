'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('List', () => {
  const { List: { WrappedComponent: List } } =
    __require('components/items/list')

  it('has class list-view', () => {
    expect(shallow(<List items={[]} columns={[]}/>))
      .to.have.className('list-view')
  })
})
