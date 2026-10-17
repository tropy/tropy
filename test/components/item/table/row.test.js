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
})
