import { mock } from 'node:test'
import { fireEvent } from '@testing-library/react'
import { render, inWindowContext } from '../../support/react.js'
import { emit } from '#tropy/dom.js'
import { PhotoList } from '#tropy/components/photo/list.js'

describe('PhotoList', () => {
  const photos = [
    { id: 1, item: 1, selections: [] },
    { id: 2, item: 1, selections: [] }
  ]

  it('renders an empty list by default', () => {
    expect(
      render(
        <PhotoList photos={[]}/>,
        inWindowContext
      ).element())
      .to.have.class('photo-list')
      .and.not.have.descendants('li.photo')
  })

  it('renders photos', () => {
    expect(
      render(
        <PhotoList photos={photos} expandedPhotos={{}}/>,
        inWindowContext
      ).element())
      .to.have.descendants('li.photo').with.length(2)
  })

  it('selects the next photo on global events', () => {
    let onSelect = mock.fn()

    render(
      <PhotoList
        current={1}
        photos={photos}
        expandedPhotos={{}}
        onSelect={onSelect}/>,
      inWindowContext)

    emit(document, 'global:nextPhoto')

    expect(onSelect.mock.calls[0].arguments[0])
      .to.include({ photo: 2, item: 1 })
  })

  it('opens the context menu for photos', () => {
    let onContextMenu = mock.fn()

    let { $ } = render(
      <PhotoList
        isDisabled
        photos={photos}
        expandedPhotos={{}}
        onContextMenu={onContextMenu}
        onSelect={() => {}}/>,
      inWindowContext)

    fireEvent.contextMenu($('.photo:last-child .photo-container'))

    expect(onContextMenu.mock.calls[0].arguments.slice(1))
      .to.eql(['photo-read-only', { id: 2, item: 1 }])
  })
})
