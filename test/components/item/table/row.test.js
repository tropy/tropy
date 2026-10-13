import { mock } from 'node:test'
import { fireEvent } from '@testing-library/react'
import { render, inWindowContext } from '../../../support/react.js'
import { TableRow } from '#tropy/components/item/table/row.js'

describe('TableRow', () => {
  const item = { id: 1, photos: [], tags: [] }
  const columns = [{ id: 'item.title' }, { id: 'y' }]

  it('renders a selected row with cells', () => {
    expect(
      render(
        <TableRow item={item} columns={columns} isSelected/>,
        inWindowContext
      ).element())
      .to.have.class('tr')
      .and.have.class('item')
      .and.have.class('active')
      .and.have.descendants('.metadata').with.length(2)
  })

  describe('click-to-edit', () => {
    beforeEach(() => {
      mock.timers.enable({ apis: ['setTimeout'] })
    })

    afterEach(() => {
      mock.timers.reset()
    })

    let click = (isOnlySelected) => {
      let onEdit = mock.fn()
      let { $$ } = render(
        <TableRow
          item={item}
          columns={columns}
          isSelected
          isOnlySelected={isOnlySelected}
          onEdit={onEdit}
          onSelect={() => {}}/>,
        inWindowContext)

      let cell = $$('.metadata')[1]
      fireEvent.mouseDown(cell, { detail: 1 })
      fireEvent.click(cell, { detail: 1 })
      mock.timers.runAll()

      return onEdit
    }

    it('edits the clicked cell of the only selected item', () => {
      expect(click(true).mock.calls[0].arguments[0])
        .to.eql({ column: { 1: 'y' } })
    })

    it('does not edit items in a multi-selection', () => {
      expect(click(false).mock.callCount()).to.equal(0)
    })
  })
})
