import { mock } from 'node:test'
import { render, fireEvent } from '@testing-library/react'
import { useClickToEdit } from '#tropy/hooks/use-click-to-edit.js'

describe('useClickToEdit', () => {
  let handler = mock.fn()

  let List = ({ isDisabled, isSelected }) => (
    <ul tabIndex={-1}>
      <li {...useClickToEdit(!isDisabled && handler, { isSelected })}/>
    </ul>
  )

  let setup = (props = { isSelected: true }) => {
    let { container, rerender } = render(<List {...props}/>)
    let list = container.firstChild
    return { list, item: list.firstChild, rerender }
  }

  // Synthetic events have no default action:
  // focus the list as the browser would after the mouse-down.
  let press = ({ list, item }, { detail = 1, ...opts } = {}) => {
    fireEvent.mouseDown(item, { detail, ...opts })
    list.focus()
    fireEvent.mouseUp(item, { detail, ...opts })
    fireEvent.click(item, { detail, ...opts })
  }

  beforeEach(() => {
    handler.mock.resetCalls()
    document.activeElement?.blur()
    mock.timers.enable({ apis: ['setTimeout'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('handles a single click on a selected item', () => {
    let dom = setup()
    dom.list.focus()
    press(dom)
    expect(handler.mock.callCount()).to.equal(0)

    mock.timers.tick(350)
    expect(handler.mock.callCount()).to.equal(1)
  })

  it('ignores the click that selected the item', () => {
    let dom = setup({ isSelected: false })
    dom.list.focus()
    fireEvent.mouseDown(dom.item, { detail: 1 })
    dom.rerender(<List isSelected/>)
    fireEvent.click(dom.item, { detail: 1 })
    mock.timers.tick(350)

    expect(handler.mock.callCount()).to.equal(0)
  })

  it('ignores the click that moved the focus', () => {
    press(setup())
    mock.timers.tick(350)
    expect(handler.mock.callCount()).to.equal(0)
  })

  it('ignores clicks with modifiers', () => {
    let dom = setup()
    dom.list.focus()
    press(dom, { shiftKey: true })
    mock.timers.tick(350)
    expect(handler.mock.callCount()).to.equal(0)
  })

  it('ignores double clicks', () => {
    let dom = setup()
    dom.list.focus()
    press(dom)
    press(dom, { detail: 2 })
    mock.timers.tick(350)
    expect(handler.mock.callCount()).to.equal(0)
  })

  it('can be disabled', () => {
    let dom = setup({ isDisabled: true, isSelected: true })
    dom.list.focus()
    press(dom)
    mock.timers.tick(350)
    expect(handler.mock.callCount()).to.equal(0)
  })
})
