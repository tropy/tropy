import { fireEvent } from '@testing-library/react'
import { render, withStore } from '../../../support/react.js'
import { ItemTable } from '#tropy/components/item/table/table.js'
import { createItemStore } from '../store.js'

describe('ItemTable', () => {
  it('renders the head, the rows and the column template', () => {
    let store = createItemStore()
    let { $, $$ } = render(<ItemTable/>, withStore(store))

    let { columns } = store.getState().nav
    let widths = columns.map(col => `${Math.max(col.width, 40)}px `)
    widths[0] = `${Math.max(columns[0].width, 100)}px `

    expect($$('.table-head .metadata-head')).to.have.length(columns.length)
    expect($('.tr.item')).to.have.class('active')
    expect($('.item-table').style.getPropertyValue('--item-template-columns'))
      .to.equal(widths.join('') + 'auto')
  })

  it('extends from the anchor with Shift+arrow keys', () => {
    let store = createItemStore()
    let { $ } = render(<ItemTable/>, withStore(store))

    fireEvent.keyDown($('.table-body .scroll-container'), { key: 'ArrowDown', shiftKey: true })
    expect(store.getState().nav.item).to.include({ anchor: 1, cursor: 2 })
  })
})
