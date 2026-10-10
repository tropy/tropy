import { mock } from 'node:test'
import { render, fireEvent } from '@testing-library/react'
import { useSequenceClicks } from '#tropy/hooks/use-sequence-clicks.js'

describe('useSequenceClicks', () => {
  let onSelect = mock.fn()
  let onSelectedClick = mock.fn()
  let onDoubleClick = mock.fn()

  let List = (props) => (
    <ul tabIndex={-1}>
      <li {...useSequenceClicks({
        onDoubleClick,
        onSelect,
        onSelectedClick,
        value: 'value',
        ...props
      })}/>
    </ul>
  )

  let setup = (props) => {
    let list = render(<List {...props}/>).container.firstChild
    list.focus()
    return list.firstChild
  }

  let click = (node, detail = 1) => {
    fireEvent.mouseDown(node, { detail })
    fireEvent.mouseUp(node, { detail })
    fireEvent.click(node, { detail })
  }

  let calls = () => [onSelect, onSelectedClick, onDoubleClick]
    .map(fn => fn.mock.callCount())

  beforeEach(() => {
    for (let fn of [onSelect, onSelectedClick, onDoubleClick])
      fn.mock.resetCalls()
    mock.timers.enable({ apis: ['setTimeout'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('selects unselected items', () => {
    click(setup({ isSelected: false }))
    mock.timers.tick(350)
    expect(calls()).to.eql([1, 0, 0])
    expect(onSelect.mock.calls[0].arguments[0]).to.equal('value')
  })

  it('handles clicks on selected items', () => {
    click(setup({ isSelected: true }))
    mock.timers.tick(350)
    expect(calls()).to.eql([1, 1, 0])
    expect(onSelectedClick.mock.calls[0].arguments[0]).to.equal('value')
  })

  it('handles double clicks', () => {
    let node = setup({ isSelected: true })
    click(node)
    click(node, 2)
    fireEvent.doubleClick(node, { detail: 2 })
    mock.timers.tick(350)
    expect(calls()).to.eql([1, 0, 1])
    expect(onDoubleClick.mock.calls[0].arguments[0]).to.equal('value')
  })

  it('can be disabled', () => {
    let node = setup({ isDisabled: true, isSelected: true })
    click(node)
    fireEvent.doubleClick(node, { detail: 2 })
    mock.timers.tick(350)
    expect(calls()).to.eql([0, 0, 0])
  })
})
