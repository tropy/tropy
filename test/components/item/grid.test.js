import { mock } from 'node:test'
import { fireEvent } from '@testing-library/react'
import { render, inWindowContext } from '../../support/react.js'
import { emit } from '#tropy/dom.js'
import { create, Selection } from '#tropy/common/selection.js'
import { ItemGrid } from '#tropy/components/item/grid.js'

describe('ItemGrid', () => {
  let items = [1, 2, 3].map(id => ({ id, photos: [], tags: [] }))

  let setup = (props) => render(
    <ItemGrid
      items={items}
      selection={new Selection(create([1]), [1, 2, 3])}
      size={128}
      onContextMenu={() => {}}
      onSelect={() => {}}
      {...props}/>,
    inWindowContext)

  let selected = (fn) =>
    fn.mock.calls.at(-1).arguments[0].item

  it('selects the next item on global events', () => {
    let onSelect = mock.fn()
    setup({ onSelect })

    emit(document, 'global:nextItem')
    expect(selected(onSelect)).to.include({ anchor: 2, cursor: 2 })
  })

  it('steps from the cursor with Shift+arrow keys', () => {
    let onSelect = mock.fn()
    let { $ } = setup({ onSelect })

    fireEvent.keyDown($('.scroll-container'), { key: 'ArrowRight', shiftKey: true })

    // A step moves the anchor (an extend would keep it at 1).
    expect(selected(onSelect)).to.include({ anchor: 2, cursor: 2 })
  })

  it('extends from the anchor on Shift-click', () => {
    let onSelect = mock.fn()
    let { $$ } = setup({ onSelect })

    fireEvent.mouseDown($$('.item .thumbnail')[1], { detail: 1, shiftKey: true })
    expect(selected(onSelect)).to.include({ anchor: 1, cursor: 2 })
  })

  it('opens the context menu for the item', () => {
    let onContextMenu = mock.fn()
    let { $$ } = setup({ onContextMenu })

    fireEvent.contextMenu($$('.item .thumbnail')[0])
    expect(onContextMenu.mock.calls[0].arguments.slice(1))
      .to.eql(['item', { id: 1, photos: [], tags: [], list: undefined }])
  })
})
