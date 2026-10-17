import { mock } from 'node:test'
import { render, inWindowContext } from '../../support/react.js'
import { List } from '#tropy/components/sequence/list.js'

describe('List', () => {
  let items = [{ id: 1 }, { id: 2 }, { id: 3 }]

  // Stable, as owners should keep it.
  let renderItem = mock.fn((item) => <span>{item.id}</span>)

  let renderList = (selection) => (
    <List
      itemClassName="item"
      itemHeight={20}
      items={items}
      renderItem={renderItem}
      selection={selection}/>
  )

  beforeEach(() => {
    renderItem.mock.resetCalls()
  })

  it('renders the items and marks the selected one', () => {
    let { $, $$ } = render(renderList(items[1]), inWindowContext)

    expect($$('li.item')).to.have.length.above(1)
    expect($('li.selected').textContent).to.equal('2')
    expect(renderItem.mock.calls[1].arguments[1])
      .to.include({ index: 1, isSelected: true })
  })

  it('renders only the rows whose state changed', () => {
    let { rerender } = render(renderList(items[0]), inWindowContext)
    renderItem.mock.resetCalls()

    rerender(renderList(items[1]))

    expect(renderItem.mock.calls.map(call => call.arguments[0]))
      .to.have.members([items[0], items[1]])
  })
})
