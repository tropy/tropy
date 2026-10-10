import { mock } from 'node:test'
import { fireEvent } from '@testing-library/react'
import { render, inWindowContext } from '../../support/react.js'
import { Tag } from '#tropy/components/tag/tag.js'

describe('Tag', () => {
  let tag = { id: 1, name: 'tag', mixed: true }
  let onFocusClick = mock.fn()

  let setup = () =>
    render(
      <Tag tag={tag} onFocusClick={onFocusClick} onSelect={() => {}}/>,
      inWindowContext
    ).element()

  // Synthetic events have no default action:
  // focus the tag as the browser would after the mouse-down.
  let press = (node) => {
    fireEvent.mouseDown(node, { detail: 1 })
    node.focus()
    fireEvent.mouseUp(node, { detail: 1 })
    fireEvent.click(node, { detail: 1 })
  }

  beforeEach(() => {
    onFocusClick.mock.resetCalls()
    document.activeElement?.blur()
  })

  it('does not commit on the click that focuses the tag', () => {
    press(setup())
    expect(onFocusClick.mock.callCount()).to.equal(0)
  })

  it('commits on a click on the focused tag', () => {
    let node = setup()
    node.focus()
    press(node)
    expect(onFocusClick.mock.calls[0].arguments).to.eql([tag])
  })
})
