import { mock } from 'node:test'
import { act } from '@testing-library/react'
import { render } from '../support/react.js'
import { DragImagePortal } from '#tropy/components/drag-image-portal.js'
import { useDragSource } from '#tropy/hooks/use-drag-source.js'

describe('useDragSource', () => {
  let Source = (props) => {
    let [{ isDragging }, drag] = useDragSource({
      getData: () => ({ type: 'field', id: 1 }),
      preview: (data) => <span className="preview">{data.id}</span>,
      ...props
    })

    return (
      <div ref={drag} className={isDragging ? 'source dragging' : 'source'}>
        source
      </div>
    )
  }

  let fire = (type, node, dataTransfer) => {
    act(() => {
      node.dispatchEvent(
        new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }))
    })
  }

  let frame = () =>
    act(() => new Promise(resolve => requestAnimationFrame(resolve)))

  it('drags its data with a native preview', async () => {
    let onDragStart = mock.fn()
    let { container } = render(
      <>
        <DragImagePortal/>
        <Source onDragStart={onDragStart}/>
      </>
    )
    let source = container.querySelector('.source')
    let dataTransfer = new DataTransfer()

    fire('dragstart', source, dataTransfer)
    expect(document.querySelector('.preview')).to.have.text('1')

    await frame()
    expect(source).to.have.class('dragging')
    expect(onDragStart.mock.calls[0].arguments[0]).to.eql({ type: 'field', id: 1 })
    expect(document.querySelector('.preview')).to.be.null

    fire('dragend', source, dataTransfer)
    expect(source).not.to.have.class('dragging')
  })
  it('leaves the element alone when disabled', () => {
    let { container } = render(<Source isDisabled/>)
    expect(container.querySelector('.source').draggable).to.be.false
  })
})
