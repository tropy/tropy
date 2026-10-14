import { mock } from 'node:test'
import { act, fireEvent, waitFor } from '@testing-library/react'
import { TestBackendImpl } from 'react-dnd-test-backend'
import { render, withStore } from '../../support/react.js'
import { emit } from '#tropy/dom.js'
import { KeyMap } from '#tropy/keymap.js'
import { PhotoList } from '#tropy/components/photo/list.js'
import { createPhotoStore } from './store.js'
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
    expect(store.getState().nav.photo).to.equal(2)
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

    down()
    expect(store.getState().nav).to.include({ photo: 1, selection: 9 })

    down()
    expect(store.getState().nav).to.include({ photo: 2, selection: undefined })
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
    let backend
    let sources
    let targets
    let { connectDragSource, connectDropTarget } = TestBackendImpl.prototype

    // The test backend does not know the DOM:
    // records the handler ids of each node.
    let record = (handlers) => function (id, node) {
      backend = this
      handlers.set(node, [...new Set([...(handlers.get(node) ?? []), id])])
      return () => {}
    }

    beforeEach(() => {
      sources = new Map()
      targets = new Map()
      TestBackendImpl.prototype.connectDragSource = record(sources)
      TestBackendImpl.prototype.connectDropTarget = record(targets)
    })

    afterEach(() => {
      Object.assign(TestBackendImpl.prototype, {
        connectDragSource,
        connectDropTarget
      })
    })

    // Without the selection row taking the drop,
    // the list would move the photo to the end.
    it('ignores photos dropped on selections', () => {
      let store = createPhotoStore({
        photos: [1, 2, 3],
        current: 1,
        expanded: true
      })

      let dispatch = mock.method(store, 'dispatch')
      let { $ } = render(<PhotoList/>, withStore(store))

      backend.simulateBeginDrag(sources.get($('li.photo')))
      backend.simulateHover([
        ...targets.get($('.photo-list')),
        ...targets.get($('li.selection'))
      ])
      backend.simulateDrop()
      backend.simulateEndDrag()

      expect(dispatch.mock.calls.map(call => call.arguments[0].type))
        .not.to.include(PHOTO.ORDER)
    })

    it('moves photos dropped outside the rows to the end', () => {
      let store = createPhotoStore({ photos: [1, 2, 3] })
      let dispatch = mock.method(store, 'dispatch')
      let { $ } = render(<PhotoList/>, withStore(store))

      backend.simulateBeginDrag(sources.get($('li.photo')))
      backend.simulateHover(targets.get($('.photo-list')))
      backend.simulateDrop()
      backend.simulateEndDrag()

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
      let { $, $$ } = render(<PhotoList/>, withStore(store))

      // Measured: all rows are rendered.
      $('.scroll-container').style.height = '200px'
      await waitFor(() => {
        expect($$('li.selection')).to.have.length(2)
      })

      // The lower half of the second selection: after it.
      // (Hover handlers see the offset passed when the drag begins.)
      let [first, second] = $$('li.selection')
      let { left, bottom } = second.getBoundingClientRect()
      let clientOffset = { x: left + 1, y: bottom - 1 }

      backend.simulateBeginDrag(sources.get(first), {
        clientOffset,
        getSourceClientOffset: () => clientOffset
      })
      act(() => backend.simulateHover(targets.get(second), { clientOffset }))
      backend.simulateDrop()
      backend.simulateEndDrag()

      expect(dispatch.mock.calls.map(call => call.arguments[0]))
        .to.deep.include({
          type: SELECTION.ORDER,
          payload: { photo: 1, selections: [10, 9] },
          meta: { cmd: 'project', history: 'merge' }
        })
    })

    it('marks the rows a photo or selection cannot be dropped on', () => {
      let store = createPhotoStore({
        current: 1,
        expanded: true,
        selections: [9, 10]
      })

      let { $, $$ } = render(<PhotoList/>, withStore(store))
      let noDropTarget = () => [...$$('li.no-drop-target')].map(li => li.className.split(' ')[0])

      act(() => backend.simulateBeginDrag(sources.get($('li.photo'))))
      expect(noDropTarget()).to.eql(['selection'])
      act(() => backend.simulateEndDrag())

      act(() => backend.simulateBeginDrag(sources.get($('li.selection'))))
      expect(noDropTarget()).to.eql(['photo'])
      act(() => backend.simulateEndDrag())

      expect(noDropTarget()).to.be.empty
    })
  })
})
