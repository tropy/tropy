import { mock } from 'node:test'
import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from '#tropy/hooks/use-debounce.js'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('settles grouped values compared shallowly', () => {
    let { result, rerender } = renderHook(({ a }) =>
      useDebouncedValue({ a }, { wait: 100, shallow: true }), {
      initialProps: { a: 1 }
    })

    rerender({ a: 2 })
    act(() => mock.timers.tick(50))

    // New but equal objects do not restart the wait.
    rerender({ a: 2 })
    expect(result.current).to.eql({ a: 1 })

    act(() => mock.timers.tick(50))
    expect(result.current).to.eql({ a: 2 })
  })
})
