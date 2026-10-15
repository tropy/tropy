import { mock } from 'node:test'
import { act, renderHook } from '@testing-library/react'
import { useDerivedState } from '#tropy/hooks/use-derived-state.js'

describe('useDerivedState', () => {
  let derive = mock.fn((n) => n * 10)

  let setup = (prop) =>
    renderHook(({ prop }) => useDerivedState(prop, derive), {
      initialProps: { prop }
    })

  beforeEach(() => {
    derive.mock.resetCalls()
  })

  it('overrides the prop until it changes', () => {
    let { result, rerender } = setup(1)
    expect(result.current[0]).to.equal(10)

    act(() => result.current[1](42))
    expect(result.current[0]).to.equal(42)

    rerender({ prop: 1 })
    expect(result.current[0]).to.equal(42)

    let [, setValue] = result.current

    rerender({ prop: 2 })
    expect(result.current[0]).to.equal(20)
    expect(result.current[1]).to.equal(setValue)

    // Overrides the new prop.
    act(() => setValue(7))
    expect(result.current[0]).to.equal(7)
  })

  it('derives undefined props', () => {
    let { result } = setup(undefined)
    expect(result.current[0]).to.be.NaN
  })

  it('derives only when the prop changes', () => {
    let { rerender } = setup(1)

    rerender({ prop: 1 })
    rerender({ prop: 1 })
    expect(derive.mock.callCount()).to.equal(1)

    rerender({ prop: 2 })
    expect(derive.mock.callCount()).to.equal(2)
  })
})
