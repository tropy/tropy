import { mock } from 'node:test'
import { render, fireEvent } from '@testing-library/react'
import { useFocusClick } from '#tropy/hooks/use-focus-click.js'

describe('useFocusClick', () => {
  let handler = mock.fn()

  let List = ({ isItemFocusable }) => (
    <ul tabIndex={-1}>
      <li
        tabIndex={isItemFocusable ? -1 : undefined}
        {...useFocusClick(handler)}/>
    </ul>
  )

  let setup = (props) => {
    let list = render(<List {...props}/>).container.firstChild
    return [list, list.firstChild]
  }

  // Synthetic events have no default action: move the focus
  // to the receiver as the browser would after the mouse-down.
  let press = (item, receiver) => {
    fireEvent.mouseDown(item, { detail: 1 })
    receiver.focus()
    fireEvent.mouseUp(item, { detail: 1 })
    fireEvent.click(item, { detail: 1 })
  }

  let report = () =>
    handler.mock.calls[0].arguments[1]

  beforeEach(() => {
    handler.mock.resetCalls()
    document.activeElement?.blur()
  })

  describe('in a focusable list', () => {
    it('reports a click that moved the focus', () => {
      let [list, item] = setup()
      press(item, list)
      expect(report()).to.eql({ hadFocus: false, hasFocusChanged: true })
    })

    it('reports a click while the list had focus', () => {
      let [list, item] = setup()
      list.focus()
      press(item, list)
      expect(report()).to.eql({ hadFocus: false, hasFocusChanged: false })
    })
  })

  describe('on a focusable item', () => {
    it('reports a click that focused the item', () => {
      let [list, item] = setup({ isItemFocusable: true })
      list.focus()
      press(item, item)
      expect(report()).to.eql({ hadFocus: false, hasFocusChanged: true })
    })

    it('reports a click while the item had focus', () => {
      let [, item] = setup({ isItemFocusable: true })
      item.focus()
      press(item, item)
      expect(report()).to.eql({ hadFocus: true, hasFocusChanged: false })
    })
  })

  it('reports clicks without a press as focused', () => {
    let [, item] = setup({ isItemFocusable: true })
    item.focus()
    fireEvent.click(item, { detail: 0 })
    expect(report()).to.eql({ hadFocus: true, hasFocusChanged: false })
  })

  it('ignores aborted presses', () => {
    let [list, item] = setup()
    fireEvent.mouseDown(item, { detail: 1 })
    list.focus()
    fireEvent.click(item, { detail: 0 })
    expect(report()).to.have.property('hasFocusChanged', false)
  })
})
