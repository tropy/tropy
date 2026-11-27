import { mock } from 'node:test'
import { useEffect, useRef } from 'react'
import { act } from '@testing-library/react'
import { render } from '../support/react.js'
import { draggable } from '#tropy/components/dnd.js'
import { useDropTarget } from '#tropy/hooks/use-drop-target.js'

describe('useDropTarget', () => {
  let Source = ({ data }) => {
    let ref = useRef(null)

    useEffect(() => draggable({
      element: ref.current,
      getInitialData: () => data
    }), [data])

    return <div ref={ref} className="source">source</div>
  }

  let Target = ({ name, children, ...props }) => {
    let [{ isOver }, drop] = useDropTarget({
      accept: 'items',
      onDrop: () => {},
      ...props
    })

    return (
      <div ref={drop} className={isOver ? `${name} over` : name}>
        {children}
      </div>
    )
  }

  let setup = (data, target) => {
    let { container } = render(
      <div>
        <Source data={data}/>
        {target}
      </div>
    )
    let dataTransfer = new DataTransfer()

    let fire = (type, selector, init) => {
      act(() => {
        container.querySelector(selector).dispatchEvent(
          new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer, ...init }))
      })
    }

    return {
      get: (selector) => container.querySelector(selector),

      drop (selector, init) {
        fire('dragstart', '.source')
        fire('dragenter', selector, init)
        fire('dragover', selector, init)
        let isOver = container.querySelector(selector).classList.contains('over')
        fire('drop', selector)
        fire('dragend', '.source')
        return isOver
      }
    }
  }

  it('drops accepted data on the innermost target', () => {
    let onOuterDrop = mock.fn()
    let onInnerDrop = mock.fn()
    let data = { type: 'items', items: [{ id: 1 }] }
    let dnd = setup(data, (
      <Target name="outer" onDrop={onOuterDrop}>
        <Target name="inner" onDrop={onInnerDrop}/>
      </Target>
    ))

    expect(dnd.drop('.inner')).to.be.true
    expect(onInnerDrop.mock.calls[0].arguments[0]).to.eql(data)
    expect(onOuterDrop.mock.callCount()).to.equal(0)
    expect(dnd.get('.inner')).not.to.have.class('over')
  })

  it('refuses other types and refused data', () => {
    let onDrop = mock.fn()
    let other = setup({ type: 'photo' }, (
      <Target name="target" onDrop={onDrop}/>
    ))
    expect(other.drop('.target')).to.be.false

    let refused = setup({ type: 'items' }, (
      <Target name="refused" canDrop={() => false} onDrop={onDrop}/>
    ))
    expect(refused.drop('.refused')).to.be.false
    expect(onDrop.mock.callCount()).to.equal(0)
  })

  // As on macOS: the modifier keys only on dragover.
  it('drops with the drop effect of the last dragover', () => {
    let onDrop = mock.fn()
    let dnd = setup({ type: 'items' }, (
      <Target
        name="target"
        getDropEffect={(data, { altKey }) => altKey ? 'copy' : 'move'}
        onDrop={onDrop}/>
    ))

    dnd.drop('.target', { altKey: true })
    expect(onDrop.mock.calls[0].arguments[1].dropEffect).to.equal('copy')
  })
})
