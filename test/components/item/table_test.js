'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Table', () => {
  const { Table } = __require('components/item/table')

  it('has class item-table-view', () => {
    expect(shallow(<Table items={[]} columns={[]}/>))
      .to.have.className('item-table-view')
  })
})
