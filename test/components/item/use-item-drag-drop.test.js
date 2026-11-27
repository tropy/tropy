import { mock } from 'node:test'
import { useEffect } from 'react'
import { act, fireEvent } from '@testing-library/react'
import { useDragDropManager } from 'react-dnd'
import { render, inWindowContext } from '../../support/react.js'
import { useItemDragDrop } from '#tropy/components/item/use-item-drag-drop.js'

describe('useItemDragDrop', () => {
  let items = [1, 2, 3]
  let data = { 1: { id: 1 }, 2: { id: 2 }, 3: { id: 3, deleted: true } }

  // Renders the items as leaves of one container and
  // returns a driver for the test backend.
  let setup = (props) => {
    let manager

    let Items = () => {
      let dndManager = useDragDropManager()

      useEffect(() => {
        manager = dndManager
      })

      let dnd = useItemDragDrop({
        items,
        data,
        selection: { ids: () => [1, 3] },
        onDragStart: () => {},
        ...props
      })

      return dnd.connect(
        <ul onDragOver={dnd.handleDragOver} onDragStart={dnd.handleDragStart}>
          {items.map((id, index) => (
            <li
              key={id}
              data-index={index}
              draggable
              className={dnd.getLeafProps(id).isOver ? 'over' : null}>
              {id}
            </li>
          ))}
        </ul>
      )
    }

    let { container } = render(<Items/>, inWindowContext)
    let leaves = container.querySelectorAll('li')
    let backend = manager.getBackend()
    let registry = manager.getRegistry()
    let [source] = [...registry.dragSources.keys()].slice(-1)
    let [target] = [...registry.dropTargets.keys()].slice(-1)

    return {
      leaves,

      drag (index) {
        fireEvent.dragStart(leaves[index])
        act(() => backend.simulateBeginDrag([source]))
      },

      hover (index) {
        let { x, y, width, height } = leaves[index].getBoundingClientRect()
        let clientOffset = { x: x + width / 2, y: y + height / 2 }
        act(() => backend.simulateHover([target], { clientOffset }))
        fireEvent.dragOver(leaves[index])
      },

      drop () {
        act(() => {
          backend.simulateDrop()
          backend.simulateEndDrag()
        })
      }
    }
  }

  it('merges the items dropped onto another item', () => {
    let onDropItems = mock.fn()
    let dnd = setup({ onDropItems })

    dnd.drag(0)
    dnd.hover(1)
    expect(dnd.leaves[1]).to.have.class('over')

    dnd.drop()
    expect(onDropItems.mock.calls[0].arguments[0]).to.eql([2, 1, 3])
  })

  it('drops nothing onto a dragged or deleted item', () => {
    let onDropItems = mock.fn()
    let dnd = setup({ onDropItems })

    dnd.drag(0)
    dnd.hover(0)
    expect(dnd.leaves[0]).not.to.have.class('over')
    dnd.hover(2)
    expect(dnd.leaves[2]).not.to.have.class('over')

    dnd.drop()
    expect(onDropItems.mock.calls).to.be.empty
  })
})
