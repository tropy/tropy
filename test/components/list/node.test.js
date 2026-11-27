import { mock } from 'node:test'
import { useEffect, useRef } from 'react'
import { act, fireEvent } from '@testing-library/react'
import { render, inWindowContext } from '../../support/react.js'
import { draggable } from '#tropy/components/dnd.js'
import { ListNode } from '#tropy/components/list/node.js'

describe('ListNode', () => {
  it('saves only id and name when renamed', () => {
    let onSave = mock.fn()
    let { container } = render(
      <ListNode
        list={{ id: 1, parent: 0, name: 'foo', children: [] }}
        isEditing
        onSave={onSave}>
        {() => null}
      </ListNode>,
      inWindowContext)

    let input = container.querySelector('input')
    fireEvent.change(input, { target: { value: 'bar' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSave.mock.callCount()).to.equal(1)
    expect(onSave.mock.calls[0].arguments[0]).to.eql({ id: 1, name: 'bar' })
  })

  it('takes items dropped on it', () => {
    let Source = () => {
      let ref = useRef(null)
      useEffect(() => draggable({
        element: ref.current,
        getInitialData: () => ({ type: 'items', items: [{ id: 7 }] })
      }), [])
      return <div ref={ref} className="source">source</div>
    }

    let onDropItems = mock.fn()
    let { container } = render(
      <>
        <Source/>
        <ListNode
          list={{ id: 1, parent: 0, name: 'foo', children: [] }}
          onDropItems={onDropItems}>
          {() => null}
        </ListNode>
      </>,
      inWindowContext)

    let dataTransfer = new DataTransfer()
    let fire = (type, node) => {
      act(() => {
        node.dispatchEvent(
          new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }))
      })
    }

    let node = container.querySelector('.list-node .node-container')
    fire('dragstart', container.querySelector('.source'))
    fire('dragenter', node)
    fire('dragover', node)
    fire('drop', node)

    expect(onDropItems.mock.calls[0].arguments[0])
      .to.eql({ list: 1, items: [{ id: 7 }] })
  })
})
