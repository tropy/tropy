import { mock } from 'node:test'
import { act, fireEvent, waitFor } from '@testing-library/react'
import { render, withStore } from '../../support/react.js'
import { emit } from '#tropy/dom.js'
import { KeyMap } from '#tropy/keymap.js'
import { PhotoList } from '#tropy/components/photo/list.js'
import { createPhotoStore } from './store.js'
import { selectNavCursor } from '#tropy/slices/nav/selectors.js'
import { PHOTO, SELECTION } from '#tropy/constants/index.js'

describe('PhotoList', () => {
  it('renders an empty list without photos', () => {
    expect(
      render(<PhotoList/>, withStore(createPhotoStore({ photos: [] })))
        .element())
      .to.have.class('photo-list')
      .and.not.have.descendants('li.photo')
  })

  it('renders photos', () => {
    expect(
      render(<PhotoList/>, withStore(createPhotoStore())).element())
      .to.have.descendants('li.photo').with.length(2)
  })

  it('selects the next photo on global events', () => {
    let store = createPhotoStore({ current: 1 })
    render(<PhotoList/>, withStore(store))

    emit(document, 'global:nextPhoto')
    expect(store.getState().nav.select.photo.cursor).to.equal(2)
  })

  it('opens the context menu for photos', () => {
    let onContextMenu = mock.fn()
    let { $ } = render(
      <PhotoList isDisabled onContextMenu={onContextMenu}/>,
      withStore(createPhotoStore()))

    fireEvent.contextMenu($('.photo:last-child .photo-container'))

    expect(onContextMenu.mock.calls[0].arguments.slice(1))
      .to.eql(['photo-read-only', { id: 2, item: 1 }])
  })

  it('steps into expanded selections with arrow keys', () => {
    let store = createPhotoStore({ current: 1, expanded: true })
    let { $ } = render(<PhotoList/>, withStore(store))
    let down = () =>
      fireEvent.keyDown($('.scroll-container'), { key: 'ArrowDown' })

    let shown = () => {
      let { photo, selection } = selectNavCursor(store.getState())
      return [photo, selection]
    }

    down()
    expect(shown()).to.eql([1, 9])

    down()
    expect(shown()).to.eql([2, null])
  })

  it('opens the context menu for expanded selections', () => {
    let onContextMenu = mock.fn()
    let { $ } = render(
      <PhotoList onContextMenu={onContextMenu}/>,
      withStore(createPhotoStore({ current: 1, expanded: true })))

    fireEvent.contextMenu($('li.selection'))

    expect(onContextMenu.mock.calls[0].arguments.slice(1))
      .to.eql(['selection', { id: 1, item: 1, selection: 9 }])
  })

  it('expands with ArrowRight (PhotoList bindings)', () => {
    let store = createPhotoStore({
      current: 1,
      expandable: true,
      keymap: {
        PhotoIterator: new KeyMap({ expand: 'Ctrl+ArrowRight' }),
        PhotoList: new KeyMap({ expand: 'ArrowRight' })
      }
    })

    let { $ } = render(<PhotoList/>, withStore(store))
    fireEvent.keyDown($('.scroll-container'), { key: 'ArrowRight' })

    expect(store.getState().panel.expand[1]).to.be.above(0)
  })

  describe('when dragging photos', () => {
    let dataTransfer

    let frame = () =>
      act(() => new Promise(resolve => requestAnimationFrame(resolve)))

    // Native drag events at f of the node's height.
    let fire = (type, node, f = 0.5) => {
      let { x, y, width, height } = node.getBoundingClientRect()
      act(() => {
        node.dispatchEvent(new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: x + width / 2,
          clientY: y + height * f,
          dataTransfer
        }))
      })
    }

    let drag = async (node) => {
      dataTransfer = new DataTransfer()
      fireEvent.pointerDown(node)
      fire('dragstart', node)
      await frame()
    }

    let hover = async (node, f) => {
      fire('dragenter', node, f)
      fire('dragover', node, f)
      await frame()
    }

    let end = async (node) => {
      act(() => {
        node.dispatchEvent(new DragEvent('dragend', { bubbles: true }))
      })
      await frame()
    }

    let drop = async (node, f) => {
      fire('drop', node, f)
      await end(node)
    }

    // Measured: all rows are rendered, with space after them.
    let renderAll = async (store, rows) => {
      let result = render(<PhotoList/>, withStore(store))
      result.$('.scroll-container').style.height = '200px'
      await waitFor(() => {
        expect(result.$$('li.photo, li.selection')).to.have.length(rows)
      })
      return result
    }

    it('ignores photos dropped on selections', async () => {
      let store = createPhotoStore({
        photos: [1, 2, 3],
        current: 1,
        expanded: true
      })

      let dispatch = mock.method(store, 'dispatch')
      let { $ } = await renderAll(store, 4)

      await drag($('li.photo'))
      await hover($('li.selection'))
      await drop($('li.selection'))

      expect(dispatch.mock.calls.map(call => call.arguments[0].type))
        .not.to.include(PHOTO.ORDER)
    })

    it('moves photos dropped outside the rows to the end', async () => {
      let store = createPhotoStore({ photos: [1, 2, 3] })
      let dispatch = mock.method(store, 'dispatch')
      let { $ } = await renderAll(store, 3)

      await drag($('li.photo'))
      await hover($('.scroll-container'), 0.95)
      await drop($('.scroll-container'), 0.95)

      expect(dispatch.mock.calls.map(call => call.arguments[0].payload))
        .to.deep.include({ item: 1, photos: [2, 3, 1] })
    })

    it('sorts selections within their photo', async () => {
      let store = createPhotoStore({
        current: 1,
        expanded: true,
        selections: [9, 10]
      })

      let dispatch = mock.method(store, 'dispatch')
      let { $$ } = await renderAll(store, 4)

      // The lower half of the second selection: after it.
      let [first, second] = $$('li.selection')

      await drag(first)
      await hover(second, 0.9)
      await drop(second, 0.9)

      expect(dispatch.mock.calls.map(call => call.arguments[0]))
        .to.deep.include({
          type: SELECTION.ORDER,
          payload: { photo: 1, selections: [10, 9] },
          meta: { cmd: 'project', history: 'merge' }
        })
    })

    it('marks the rows a photo or selection cannot be dropped on', async () => {
      let store = createPhotoStore({
        current: 1,
        expanded: true,
        selections: [9, 10]
      })

      let { $, $$ } = await renderAll(store, 4)
      let noDropTarget = () =>
        [...$$('li.no-drop-target')].map(li => li.className.split(' ')[0])

      await drag($('li.photo'))
      expect(noDropTarget()).to.eql(['selection', 'selection'])
      await end($('li.photo'))

      await drag($('li.selection'))
      expect(noDropTarget()).to.eql(['photo', 'photo'])
      await end($('li.selection'))

      expect(noDropTarget()).to.be.empty
    })
  })
})
