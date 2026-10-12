import { mock } from 'node:test'
import { render } from '@testing-library/react'
import { useEventHandler } from '#tropy/hooks/use-event-handler.js'

describe('useEventHandler', () => {
  let target

  beforeEach(() => {
    target = new EventTarget()
    mock.method(target, 'addEventListener')
    mock.method(target, 'removeEventListener')
  })

  let Handler = ({ callback }) => {
    useEventHandler(target, 'test', callback)
    return null
  }

  it('calls the callback while mounted', () => {
    let callback = mock.fn()
    let { unmount } = render(<Handler callback={callback}/>)

    target.dispatchEvent(new Event('test'))
    expect(callback.mock.callCount()).to.equal(1)

    unmount()
    target.dispatchEvent(new Event('test'))
    expect(callback.mock.callCount()).to.equal(1)
  })

  it('registers no listener without callback', () => {
    let { rerender, unmount } = render(<Handler/>)
    expect(target.addEventListener.mock.callCount()).to.equal(0)

    let callback = mock.fn()
    rerender(<Handler callback={callback}/>)
    expect(target.addEventListener.mock.callCount()).to.equal(1)

    rerender(<Handler/>)
    expect(target.removeEventListener.mock.callCount()).to.equal(1)

    unmount()
  })
})
