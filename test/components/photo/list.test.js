import { mock } from 'node:test'
import { fireEvent } from '@testing-library/react'
import { render, withStore } from '../../support/react.js'
import { emit } from '#tropy/dom.js'
import { KeyMap } from '#tropy/keymap.js'
import { PhotoList } from '#tropy/components/photo/list.js'
import { createPhotoStore } from './store.js'

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

    fireEvent.contextMenu($('.selection-list li'))

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
})
