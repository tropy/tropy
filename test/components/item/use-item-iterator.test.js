import { renderHook } from '@testing-library/react'
import { withStore } from '../../support/react.js'
import { useItemIterator } from '#tropy/components/item/use-item-iterator.js'
import { createItemStore } from './store.js'

describe('useItemIterator', () => {
  // Scroll's autoselect on focus selects without an event.
  let autoselect = (selected) => {
    let store = createItemStore(selected)
    let { result } = renderHook(() => useItemIterator({}, {}), withStore(store))

    let before = store.getState().nav.item
    result.current.handleSelectItem({ id: 2 })

    return [before, store.getState().nav.item]
  }

  it('keeps an existing selection on autoselect', () => {
    let [before, after] = autoselect([1, 3])
    expect(after).to.equal(before)
  })

  it('selects on autoselect without a selection', () => {
    let [, after] = autoselect([])
    expect(after).to.include({ anchor: 2, cursor: 2 })
  })
})
