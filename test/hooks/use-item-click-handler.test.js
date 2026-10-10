import { mock } from 'node:test'
import { render, fireEvent } from '@testing-library/react'
import { useItemClickHandler } from '#tropy/hooks/use-item-click-handler.js'

describe('useItemClickHandler', () => {
  let item = { id: 1, photos: [] }
  let onSelect = mock.fn()

  let Item = ({ isSelected }) => (
    <div {...useItemClickHandler(item, { isSelected, onSelect })}/>
  )

  beforeEach(() => {
    onSelect.mock.resetCalls()
  })

  it('selects unselected items on mouse down', () => {
    let { container } = render(<Item isSelected={false}/>)

    fireEvent.mouseDown(container.firstChild)
    expect(onSelect.mock.callCount()).to.equal(1)

    fireEvent.click(container.firstChild)
    expect(onSelect.mock.callCount()).to.equal(1)
  })

  it('selects selected items on click', () => {
    let { container } = render(<Item isSelected/>)

    fireEvent.mouseDown(container.firstChild)
    expect(onSelect.mock.callCount()).to.equal(0)

    fireEvent.click(container.firstChild)
    expect(onSelect.mock.callCount()).to.equal(1)
  })

  it('passes range and meta modifiers', () => {
    let { container } = render(<Item isSelected={false}/>)
    fireEvent.mouseDown(container.firstChild, { shiftKey: true })

    expect(onSelect.mock.calls[0].arguments)
      .to.eql([item, { isMeta: false, isRange: true }])
  })
})
