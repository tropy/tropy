import { render } from '../../../support/react'
import { TableHead } from '../../../../src/components/item/table/head'

describe('TableHead', () => {

  it('has class table-head', () => {
    expect(
      render(<TableHead columns={[]}/>).element()
    ).to.have.class('table-head')
  })

  it('renders head columns', () => {
    // TODO use column fixtures
    const columns = [{ id: 'x' }, { id: 'y' }]
    const colwidth = [40, 60]

    const sort = {
      column: 'y', asc: true, type: 'property'
    }

    expect(
      render(
        <TableHead
          columns={columns}
          colwidth={colwidth}
          sort={sort}/>
      ).element())
      .to.have.descendants('.metadata-head')
      .with.length(columns.length)

  })
})
