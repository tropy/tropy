import { mock } from 'node:test'
import { render, fireEvent } from '@testing-library/react'
import { useSequenceClicks } from '#tropy/hooks/use-sequence-clicks.js'
import { Cursor } from '#tropy/common/sequence.js'

describe('useSequenceClicks', () => {
  let seq = [{ id: 1 }, { id: 2 }, { id: 3 }]

  let onContextMenu = mock.fn()
  let onDoubleClick = mock.fn()
  let onSelect = mock.fn()
  let onSelectedClick = mock.fn()

  let List = ({ at = 1, ...props }) => (
    <ul tabIndex={-1} {...useSequenceClicks(new Cursor(seq, at), {
      onContextMenu,
      onDoubleClick,
      onSelect,
      onSelectedClick,
      ...props
    })}>
      {seq.map((el, index) => (
        <li key={el.id} data-index={index}><span/></li>
      ))}
      <li className="other"/>
    </ul>
  )

  // Returns the list and the inner node of each row.
  let setup = (props) => {
    let { container, rerender } = render(<List {...props}/>)
    let list = container.firstChild

    list.focus()

    return {
      list,
      rows: [...list.querySelectorAll('span')],
      rerender
    }
  }

  let click = (node, { detail = 1, ...opts } = {}) => {
    fireEvent.mouseDown(node, { detail, ...opts })
    fireEvent.mouseUp(node, { detail, ...opts })
    fireEvent.click(node, { detail, ...opts })
  }

  let calls = () => [onSelect, onSelectedClick, onDoubleClick]
    .map(fn => fn.mock.callCount())

  beforeEach(() => {
    for (let fn of [onContextMenu, onDoubleClick, onSelect, onSelectedClick])
      fn.mock.resetCalls()
    mock.timers.enable({ apis: ['setTimeout'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('selects unselected elements on mouse-down', () => {
    let { rows } = setup()

    fireEvent.mouseDown(rows[1], { detail: 1, shiftKey: true })

    let [element, mods] = onSelect.mock.calls[0].arguments
    expect(element).to.equal(seq[1])
    expect(mods).to.include({ shiftKey: true })
  })

  it('handles single clicks on selected elements', () => {
    let { rows } = setup()

    click(rows[0])
    expect(calls()).to.eql([1, 0, 0])

    mock.timers.tick(350)
    expect(calls()).to.eql([1, 1, 0])
    expect(onSelectedClick.mock.calls[0].arguments[0]).to.equal(seq[0])
  })

  it('selects selected elements again without selected clicks', () => {
    let { rows } = setup({ onSelectedClick: undefined })

    click(rows[0])
    expect(onSelect.mock.calls[0].arguments[0]).to.equal(seq[0])
  })

  it('ignores the click that selected the element', () => {
    let { rows, rerender } = setup()

    fireEvent.mouseDown(rows[1], { detail: 1 })
    rerender(<List at={2}/>)
    fireEvent.click(rows[1], { detail: 1 })
    mock.timers.tick(350)

    expect(calls()).to.eql([1, 0, 0])
  })

  it('ignores the click if deselected during the delay', () => {
    let { rows, rerender } = setup()

    click(rows[0])
    rerender(<List at={2}/>)
    mock.timers.tick(350)

    expect(onSelectedClick.mock.callCount()).to.equal(0)
  })

  it('handles double clicks', () => {
    let { rows } = setup()

    click(rows[0])
    click(rows[0], { detail: 2 })
    fireEvent.doubleClick(rows[0], { detail: 2 })
    mock.timers.tick(350)

    expect(calls()).to.eql([1, 0, 1])
    expect(onDoubleClick.mock.calls[0].arguments[0]).to.equal(seq[0])
  })

  it('uses the given selection', () => {
    let { rows } = setup({ isSelected: (el) => el.id !== 1 })

    click(rows[0])
    click(rows[2])
    mock.timers.tick(350)

    expect(onSelect.mock.calls[0].arguments[0]).to.equal(seq[0])
    expect(onSelectedClick.mock.calls[0].arguments[0]).to.equal(seq[2])
  })

  it('reports context menus with the element', () => {
    let { rows } = setup()

    fireEvent.contextMenu(rows[2])
    expect(onContextMenu.mock.calls[0].arguments[1]).to.equal(seq[2])
  })

  it('ignores clicks outside the elements', () => {
    let { list } = setup()

    click(list.querySelector('.other'))
    fireEvent.doubleClick(list, { detail: 2 })
    fireEvent.contextMenu(list)
    mock.timers.tick(350)

    expect(calls()).to.eql([0, 0, 0])
    expect(onContextMenu.mock.callCount()).to.equal(0)
  })

  it('can be disabled', () => {
    let { rows } = setup({ isDisabled: true })

    click(rows[0])
    click(rows[1])
    fireEvent.doubleClick(rows[0], { detail: 2 })
    mock.timers.tick(350)

    expect(calls()).to.eql([0, 0, 0])
  })
})
