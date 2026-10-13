import { render, inWindowContext } from '../../../support/react.js'
import { create, Selection } from '#tropy/common/selection.js'
import { ItemTable } from '#tropy/components/item/table/table.js'

describe('ItemTable', () => {
  let items = [1, 2].map(id => ({ id, photos: [], tags: [] }))
  let active = [{ id: 'item.title', width: 200 }, { id: 'y', width: 80 }]

  it('renders the head and rows with the column template', () => {
    let { $, $$ } = render(
      <ItemTable
        columns={{ active, all: active, common: active }}
        data={{}}
        items={items}
        selection={new Selection(create([1]), [1, 2])}
        sort={{ asc: true }}
        templates={{}}/>,
      inWindowContext)

    expect($$('.table-head .metadata-head')).to.have.length(2)
    expect($$('.tr.item')).to.have.length(2)
    expect($('.item-table').style.getPropertyValue('--item-template-columns'))
      .to.equal('200px 80px auto')
  })
})
