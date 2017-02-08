'use strict'

const React = require('react')
const { shallow } = require('enzyme')
const { noop } = __require('common/util')

describe('ItemTable', () => {
  const { ItemTable } = __require('components/item/table')

  it('has class item-table-view', () => {
    expect(shallow(<ItemTable items={[]} columns={[]} dt={noop}/>))
      .to.have.className('item-table-view')
  })
})
