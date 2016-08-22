'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('List', () => {
  const { List: { WrappedComponent: List } } =
    __require('components/items/list')

  it('has class item-list', () => {
    expect(shallow(<List items={[]} columns={[]}/>))
      .to.have.className('item-list')
  })
})
