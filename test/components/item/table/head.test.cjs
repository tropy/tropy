import { render, inWindowContext } from '../../../support/react.cjs'
import { TableHead } from '#tropy/components/item/table/head.js'

describe('TableHead', () => {
  it('has class table-head', () => {
    expect(
      render(<TableHead columns={[]}/>).element()
    ).to.have.class('table-head')
  })

  it('renders head columns', () => {
    const columns = [{ id: 'x' }, { id: 'y' }]
    const colwidth = [40, 60]
    const sort = { column: 'y', asc: true, type: 'property' }

    expect(
      render(
        <TableHead
          columns={columns}
          colwidth={colwidth}
          sort={sort}/>,
        inWindowContext).element())
      .to.have.descendants('.metadata-head')
      .with.length(columns.length)
  })
})
