import { mock } from 'node:test'
import { act, fireEvent } from '@testing-library/react'
import { render, withStore } from '../../../support/react.js'
import { ItemTable } from '#tropy/components/item/table/table.js'
import { createItemStore } from '../store.js'
import * as actions from '#tropy/actions/index.js'

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

  describe('click-to-edit', () => {
    beforeEach(() => {
      mock.timers.enable({ apis: ['setTimeout'] })
    })

    afterEach(() => {
      mock.timers.reset()
    })

    let setup = (selected) => {
      let store = createItemStore(selected)
      let { $ } = render(<ItemTable/>, withStore(store))

      // The second cell of the first item.
      let cell = $('.tr.item').querySelectorAll('.metadata')[1]

      return { cell, store }
    }

    let click = (cell) => {
      fireEvent.mouseDown(cell, { detail: 1 })
      fireEvent.click(cell, { detail: 1 })
      mock.timers.runAll()
    }

    it('edits the clicked cell of the only selected item', () => {
      let { cell, store } = setup([1])

      click(cell)
      expect(store.getState().edit.column)
        .to.eql({ 1: cell.dataset.column })
    })

    it('does not edit items in a multi-selection', () => {
      let { cell, store } = setup([1, 2])

      click(cell)
      expect(store.getState().edit.column).not.to.exist
    })

    it('does not restart editing the edited cell', () => {
      let { cell, store } = setup([1])

      act(() => {
        store.dispatch(actions.edit.start({
          column: { 1: cell.dataset.column }
        }))
      })

      let editing = store.getState().edit
      click(cell)
      expect(store.getState().edit).to.equal(editing)
    })
  })
})
