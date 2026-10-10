import { mock } from 'node:test'
import { renderHook } from '@testing-library/react'
import { inWindowContext } from '../support/react.js'
import { useSortableSequence } from '#tropy/hooks/use-sortable-sequence.js'

describe('useSortableSequence', () => {
  let setup = (props) =>
    renderHook(() => useSortableSequence({
      type: 'test',
      items: [1, 2, 3],
      onSort: () => {},
      ...props
    }), inWindowContext).result.current

  it('reports the new order on drop', () => {
    let onSort = mock.fn()
    setup({ onSort }).onDrop({ id: 3, to: 1, offset: 0 })
    expect(onSort.mock.calls[0].arguments[0]).to.eql([3, 1, 2])
  })

  it('finds the adjacent ids', () => {
    let { getAdjacent } = setup()
    expect(getAdjacent({ id: 1 })).to.eql([null, 2])
    expect(getAdjacent({ id: 2 })).to.eql([1, 3])
  })

  it('is sortable only with several items, unless disabled', () => {
    expect(setup().isSortable).to.be.true
    expect(setup({ items: [1] }).isSortable).to.be.false
    expect(setup({ isDisabled: true }).isSortable).to.be.false
  })
})
