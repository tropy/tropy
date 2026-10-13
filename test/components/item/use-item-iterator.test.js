import { mock } from 'node:test'
import { renderHook } from '@testing-library/react'
import { inWindowContext } from '../../support/react.js'
import { create, Selection } from '#tropy/common/selection.js'
import { useItemIterator } from '#tropy/components/item/use-item-iterator.js'

describe('useItemIterator', () => {
  let items = [1, 2, 3].map(id => ({ id, photos: [], tags: [] }))

  let setup = (ids, onSelect) =>
    renderHook(() => useItemIterator({
      items,
      selection: new Selection(create(ids), [1, 2, 3]),
      onSelect
    }, {}), inWindowContext).result.current

  // Scroll's autoselect on focus selects without an event.
  it('keeps an existing selection on autoselect', () => {
    let onSelect = mock.fn()
    setup([1, 2], onSelect).handleSelectItem(items[1])
    expect(onSelect.mock.callCount()).to.equal(0)
  })

  it('selects on autoselect without a selection', () => {
    let onSelect = mock.fn()
    setup([], onSelect).handleSelectItem(items[1])
    expect(onSelect.mock.callCount()).to.equal(1)
  })
})
