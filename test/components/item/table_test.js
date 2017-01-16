'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('ItemTable', () => {
  const { ItemTable } = __require('components/item/table')

  it('has class item-table-view', () => {
    expect(shallow(<ItemTable items={[]} columns={[]}/>))
      .to.have.className('item-table-view')
  })
})
