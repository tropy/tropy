import { mock } from 'node:test'
import { fireEvent, waitFor } from '@testing-library/react'
import { render, withStore } from '../../support/react.js'
import { emit } from '#tropy/dom.js'
import { ItemGrid } from '#tropy/components/item/grid.js'
import { createItemStore } from './store.js'

describe('ItemGrid', () => {
  let store

  let setup = (props) => {
    store = createItemStore()

    return render(
      <ItemGrid size={128} onContextMenu={() => {}} {...props}/>,
      withStore(store))
  }

  let selection = () => store.getState().nav.item

  it('selects the next item on global events', () => {
    setup()
    emit(document, 'global:nextItem')
    expect(selection()).to.include({ anchor: 2, cursor: 2 })
  })

  it('steps from the cursor with Shift+arrow keys', async () => {
    let { $ } = setup()

    // The grid layout is known once Scroll has measured itself.
    // A step moves the anchor (an extend would keep it at 1).
    await waitFor(() => {
      fireEvent.keyDown($('.scroll-container'), { key: 'ArrowRight', shiftKey: true })
      expect(selection()).to.include({ anchor: 2, cursor: 2 })
    })
  })

  it('extends from the anchor on Shift-click', () => {
    let { $$ } = setup()
    fireEvent.mouseDown($$('.item .thumbnail')[1], { detail: 1, shiftKey: true })
    expect(selection()).to.include({ anchor: 1, cursor: 2 })
  })

  it('opens the context menu for the item', () => {
    let onContextMenu = mock.fn()
    let { $$ } = setup({ onContextMenu })

    fireEvent.contextMenu($$('.item .thumbnail')[0])
    expect(onContextMenu.mock.calls[0].arguments.slice(1))
      .to.eql(['item', { id: 1, photos: [], tags: [], list: undefined }])
  })
})
