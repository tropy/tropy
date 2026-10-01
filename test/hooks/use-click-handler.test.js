import { mock } from 'node:test'
import { render, fireEvent } from '@testing-library/react'
import { useClickHandler } from '#tropy/hooks/use-click-handler.js'

describe('useClickHandler', () => {
  let onSingleClick = mock.fn()
  let onDoubleClick = mock.fn()

  let Button = ({ onClick }) => (
    <button
      onClick={useClickHandler({ onClick, onSingleClick, onDoubleClick }, 10)}/>
  )

  let wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  beforeEach(() => {
    onSingleClick.mock.resetCalls()
    onDoubleClick.mock.resetCalls()
  })

  it('handles double clicks', async () => {
    let { container } = render(<Button/>)
    fireEvent.click(container.firstChild)
    fireEvent.click(container.firstChild)
    await wait(20)

    expect(onDoubleClick.mock.callCount()).to.equal(1)
    expect(onSingleClick.mock.callCount()).to.equal(0)
  })

  it('cancels the click when onClick returns true', async () => {
    let isSelected = false
    let select = () => !isSelected && (isSelected = true)

    let { container } = render(<Button onClick={select}/>)
    fireEvent.click(container.firstChild)
    fireEvent.click(container.firstChild)
    await wait(20)

    expect(onDoubleClick.mock.callCount()).to.equal(0)
    expect(onSingleClick.mock.callCount()).to.equal(0)
  })
})
