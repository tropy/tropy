import { mock } from 'node:test'
import { render, fireEvent } from '@testing-library/react'
import { useClickToSelect } from '#tropy/hooks/use-click-to-select.js'

describe('useClickToSelect', () => {
  let onSelect = mock.fn()

  let Item = ({ isDisabled, isSelected }) => (
    <li {...useClickToSelect({
      isDisabled,
      isSelected,
      onSelect,
      value: 'value'
    })}/>
  )

  let setup = (props) =>
    render(<Item {...props}/>).container.firstChild

  beforeEach(() => {
    onSelect.mock.resetCalls()
  })

  it('selects unselected items on mouse-down', () => {
    let node = setup({ isSelected: false })
    fireEvent.mouseDown(node, { shiftKey: true })

    let [value, keyState] = onSelect.mock.calls[0].arguments
    expect(value).to.equal('value')
    expect(keyState).to.include({ shiftKey: true, metaKey: false })
  })

  it('selects unselected items on right mouse-down', () => {
    fireEvent.mouseDown(setup({ isSelected: false }), { button: 2 })
    expect(onSelect.mock.callCount()).to.equal(1)
  })

  it('selects selected items on click only', () => {
    let node = setup({ isSelected: true })
    fireEvent.mouseDown(node)
    expect(onSelect.mock.callCount()).to.equal(0)

    fireEvent.click(node)
    expect(onSelect.mock.callCount()).to.equal(1)
  })

  it('selects once when the press selected the item', () => {
    let node = setup({ isSelected: false })
    fireEvent.mouseDown(node)
    fireEvent.click(node)
    expect(onSelect.mock.callCount()).to.equal(1)
  })

  it('can be disabled', () => {
    let node = setup({ isDisabled: true, isSelected: true })
    fireEvent.mouseDown(node)
    fireEvent.click(node)
    expect(onSelect.mock.callCount()).to.equal(0)
  })
})
