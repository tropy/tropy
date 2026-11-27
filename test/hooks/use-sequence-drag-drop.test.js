import { mock } from 'node:test'
import { act, fireEvent } from '@testing-library/react'
import { render } from '../support/react.js'
import { useSequenceDragDrop } from '#tropy/hooks/use-sequence-drag-drop.js'

describe('useSequenceDragDrop', () => {
  let seq = [1, 2, 3]

  let frame = () =>
    act(() => new Promise(resolve => requestAnimationFrame(resolve)))

  // Renders the ids as leaves of one container and
  // returns a driver dispatching native drag events.
  let setup = (options) => {
    let Sequence = () => {
      let { getLeafProps, onPointerDown, setContainer } =
        useSequenceDragDrop(seq, options)

      // The padding is the space past the last leaf.
      return (
        <ul
          ref={setContainer}
          style={{ paddingBottom: 40 }}
          onPointerDown={onPointerDown}>
          {seq.map((id, index) => {
            let { direction, isOver } = getLeafProps(id)
            return (
              <li
                key={id}
                data-index={index}
                className={[isOver && 'over', direction].filter(Boolean).join(' ')}>
                {id}
              </li>
            )
          })}
        </ul>
      )
    }

    let { container } = render(<Sequence/>)
    let list = container.querySelector('ul')
    let leaves = container.querySelectorAll('li')
    let dataTransfer = new DataTransfer()
    let last

    // At f of the node's height.
    let fire = (type, node, f = 0.5) => {
      let { x, y, width, height } = node.getBoundingClientRect()
      last = [node, f]
      let event = new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x + width / 2,
        clientY: y + height * f,
        dataTransfer
      })
      act(() => { node.dispatchEvent(event) })
      return event
    }

    return {
      leaves,

      drag (index) {
        fireEvent.pointerDown(leaves[index])
        return fire('dragstart', leaves[index])
      },

      // A leaf, or past the last leaf (no index).
      async hover (index, f) {
        let node = (index == null) ? list : leaves[index]
        if (index == null) f = 0.98
        fire('dragenter', node, f)
        fire('dragover', node, f)
        await frame()
      },

      async drop () {
        let [node] = last
        fire('drop', ...last)
        act(() => {
          node.dispatchEvent(new DragEvent('dragend', { bubbles: true }))
        })
        await frame()
      }
    }
  }

  let options = (props) => ({
    getData: (id) => (id === 3) ? null : { type: 'test', id },
    accept: 'test',
    canDrop: (data, id) => id !== data.id,
    ...props
  })

  it('drops the pressed leaf’s data onto another leaf', async () => {
    let onDragStart = mock.fn()
    let onDrop = mock.fn()
    let dnd = setup(options({ onDragStart, onDrop }))

    dnd.drag(0)
    await dnd.hover(1)
    expect(onDragStart.mock.calls[0].arguments[0]).to.eql({ type: 'test', id: 1 })
    expect(dnd.leaves[1]).to.have.class('over')

    await dnd.drop()
    expect(onDrop.mock.calls[0].arguments).to.eql([{ type: 'test', id: 1 }, 2])
    expect(dnd.leaves[1]).not.to.have.class('over')
  })

  it('drops nothing where canDrop refuses', async () => {
    let onDrop = mock.fn()
    let dnd = setup(options({ onDrop }))

    dnd.drag(0)
    await dnd.hover(0)
    expect(dnd.leaves[0]).not.to.have.class('over')

    await dnd.drop()
    expect(onDrop.mock.calls).to.be.empty
  })

  it('does not drag leaves without data', () => {
    let onDragStart = mock.fn()
    let dnd = setup(options({ onDragStart }))

    dnd.drag(2)
    expect(dnd.leaves[2].draggable).to.be.false
    expect(onDragStart.mock.calls).to.be.empty
  })

  it('does nothing without options', () => {
    let dnd = setup()

    dnd.drag(0)
    expect(dnd.leaves[0].draggable).to.be.false
  })

  describe('sorting', () => {
    let sorting = (onSort) => ({
      getData: (id) => ({ type: 'test', id }),
      sort: { accept: 'test', onSort }
    })

    it('sorts before or after a leaf', async () => {
      let onSort = mock.fn()
      let dnd = setup(sorting(onSort))

      dnd.drag(0)
      await dnd.hover(2, 0.25)
      expect(dnd.leaves[2]).to.have.class('before')

      await dnd.drop()
      expect(onSort.mock.calls[0].arguments[0]).to.eql([2, 1, 3])
    })

    it('sorts past the last leaf to the end', async () => {
      let onSort = mock.fn()
      let dnd = setup(sorting(onSort))

      dnd.drag(0)
      await dnd.hover()
      expect(dnd.leaves[2]).to.have.class('after')

      await dnd.drop()
      expect(onSort.mock.calls[0].arguments[0]).to.eql([2, 3, 1])
    })

    it('ignores moves that keep the order', async () => {
      let onSort = mock.fn()
      let dnd = setup(sorting(onSort))

      dnd.drag(0)
      await dnd.hover(1, 0.25)
      expect(dnd.leaves[1]).not.to.have.class('over')

      await dnd.drop()
      expect(onSort.mock.calls).to.be.empty
    })
  })
})
