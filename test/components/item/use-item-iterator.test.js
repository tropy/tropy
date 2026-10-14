import { renderHook } from '@testing-library/react'
import { withStore } from '../../support/react.js'
import { useItemIterator } from '#tropy/components/item/use-item-iterator.js'
import { createItemStore } from './store.js'

describe('useItemIterator', () => {
  // Tab focus (reported by Scroll) with item 2 as current.
  let focus = (selected) => {
    let store = createItemStore(selected)
    let { result } = renderHook(() => useItemIterator({}, {}), withStore(store))

    result.current.scroll.current = { current: { id: 2 } }

    let before = store.getState().nav.item
    result.current.handleTabFocus()

    return [before, store.getState().nav.item]
  }

  it('keeps an existing selection on tab focus', () => {
    let [before, after] = focus([1, 3])
    expect(after).to.equal(before)
  })

  it('selects the current item on tab focus without a selection', () => {
    let [, after] = focus([])
    expect(after).to.include({ anchor: 2, cursor: 2 })
  })
})
