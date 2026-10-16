import { act, renderHook } from '@testing-library/react'
import { useDraftState } from '#tropy/hooks/use-draft-state.js'

describe('useDraftState', () => {
  let setup = (prop) =>
    renderHook(({ prop }) => useDraftState(prop), {
      initialProps: { prop }
    })

  it('overrides the prop until it changes', () => {
    let { result, rerender } = setup(1)
    expect(result.current[0]).to.equal(1)

    act(() => result.current[1](42))
    expect(result.current[0]).to.equal(42)

    rerender({ prop: 1 })
    expect(result.current[0]).to.equal(42)

    let [, setValue] = result.current

    rerender({ prop: 2 })
    expect(result.current[0]).to.equal(2)
    expect(result.current[1]).to.equal(setValue)

    // Overrides the new prop.
    act(() => setValue(7))
    expect(result.current[0]).to.equal(7)
  })

  it('discards the draft when the prop changes back', () => {
    let { result, rerender } = setup(1)

    act(() => result.current[1](42))
    rerender({ prop: 2 })
    rerender({ prop: 1 })
    expect(result.current[0]).to.equal(1)
  })

  it('supports NaN props', () => {
    let { result } = setup(NaN)
    expect(result.current[0]).to.be.NaN
  })
})
