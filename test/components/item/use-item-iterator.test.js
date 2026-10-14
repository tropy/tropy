import { renderHook } from '@testing-library/react'
import { withStore } from '../../support/react.js'
import { useItemIterator } from '#tropy/components/item/use-item-iterator.js'
import { createItemStore } from './store.js'

describe('useItemIterator', () => {
  // Tab focus (reported by Scroll).
  let focus = (selected) => {
    let store = createItemStore(selected)
    let { result } = renderHook(() => useItemIterator({}, {}), withStore(store))

    let before = store.getState().nav.item
    result.current.handleTabFocus()

    return [before, store.getState().nav.item]
  }

  it('keeps an existing selection on tab focus', () => {
    let [before, after] = focus([1, 3])
    expect(after).to.equal(before)
  })

  it('selects the first item on tab focus without a selection', () => {
    let [, after] = focus([])
    expect(after).to.include({ anchor: 1, cursor: 1 })
  })
})
