'use strict'

const React = require('react')
const { render } = require('../../support/react')

describe('ItemTableHead', () => {
  const { ItemTableHead } = __require('components/item/table-head')

  it('has class table-head', () => {
    expect(
      render(<ItemTableHead columns={[]}/>).element()
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
        <ItemTableHead
          columns={columns}
          colwidth={colwidth}
          sort={sort}/>
      ).element())
      .to.have.descendants('.metadata-head')
      .with.length(columns.length)

  })
})
