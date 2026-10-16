import { mock } from 'node:test'
import { act, renderHook } from '@testing-library/react'
import { useColumnState } from '#tropy/components/item/table/use-columns.js'

describe('useColumnState', () => {
  let active = [{ id: 'a', width: 50 }, { id: 'b', width: 20 }]

  let setup = (props) =>
    renderHook((p) => useColumnState(p), {
      initialProps: { columns: { active }, ...props }
    })

  it('applies the minimum widths', () => {
    let { result } = setup()
    expect(result.current.colwidth).to.eql([100, 40])
    expect(result.current.minWidth).to.equal(140)
  })

  it('resizes locally and commits on release', () => {
    let onColumnResize = mock.fn()
    let { result } = setup({ onColumnResize })

    act(() => result.current.resize({ column: 1, width: 60 }, false))
    expect(result.current.colwidth).to.eql([100, 60])
    expect(onColumnResize.mock.callCount()).to.equal(0)

    act(() => result.current.resize({ column: 1, width: 70 }, true))
    expect(onColumnResize.mock.calls[0].arguments[0])
      .to.eql({ column: 1, width: 70 })
  })

  it('reorders and resets when the columns change', () => {
    let onColumnOrder = mock.fn()
    let { result, rerender } = setup({ onColumnOrder })

    act(() => result.current.order(0, 1))
    expect(result.current.columns.map(c => c.id)).to.eql(['b', 'a'])
    expect(onColumnOrder.mock.calls[0].arguments[0])
      .to.eql({ order: { b: 0, a: 1 } })

    rerender({ columns: { active: [...active] }, onColumnOrder })
    expect(result.current.columns.map(c => c.id)).to.eql(['a', 'b'])
  })
})
