import { mock } from 'node:test'
import { render, fireEvent } from '@testing-library/react'
import { useSingleClick } from '#tropy/hooks/use-single-click.js'

describe('useSingleClick', () => {
  let handler = mock.fn()
  let delay = 10

  let Button = () => (
    <button {...useSingleClick(handler, { delay })}/>
  )

  let press = (node, detail) => {
    fireEvent.mouseDown(node, { detail })
    fireEvent.mouseUp(node, { detail })
    fireEvent.click(node, { detail })
  }

  beforeEach(() => {
    handler.mock.resetCalls()
    mock.timers.enable({ apis: ['setTimeout'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('handles single clicks after the delay', () => {
    let { container } = render(<Button/>)
    press(container.firstChild, 1)
    mock.timers.tick(delay / 2)
    expect(handler.mock.callCount()).to.equal(0)

    mock.timers.tick(delay / 2)
    expect(handler.mock.callCount()).to.equal(1)
  })

  it('ignores double clicks', () => {
    let { container } = render(<Button/>)
    press(container.firstChild, 1)
    press(container.firstChild, 2)
    mock.timers.tick(delay)

    expect(handler.mock.callCount()).to.equal(0)
  })

  it('ignores clicks without a press (e.g., by keyboard)', () => {
    let { container } = render(<Button/>)
    fireEvent.click(container.firstChild, { detail: 0 })
    mock.timers.tick(delay)

    expect(handler.mock.callCount()).to.equal(0)
  })

  it('cancels on unmount', () => {
    let { container, unmount } = render(<Button/>)
    press(container.firstChild, 1)
    unmount()
    mock.timers.tick(delay)

    expect(handler.mock.callCount()).to.equal(0)
  })
})
