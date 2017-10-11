'use strict'

const React = require('react')
const { shallow } = require('enzyme')
const { noop } = __require('common/util')

describe.skip('ItemTable', () => {
  const { ItemTable } = __require('components/item/table')

  it('has classes item and table', () => {
    expect(shallow(
      <ItemTable
        items={[]}
        selection={[]}
        columns={[]}
        dt={noop}/>)).to.have.className('item table')
  })
})
