import { fireEvent, waitFor } from '@testing-library/react'
import { render, withStore } from '../../support/react.js'
import { KeyMap } from '#tropy/keymap.js'
import { PhotoGrid } from '#tropy/components/photo/grid.js'
import { createPhotoStore } from './store.js'

describe('PhotoGrid', () => {
  it('renders photos', () => {
    expect(
      render(<PhotoGrid size={128}/>, withStore(createPhotoStore()))
        .element())
      .to.have.class('photo-grid')
      .and.have.descendants('li.photo').with.length(2)
  })

  // Plain Left/Right expand/contract only in the list (PhotoList).
  it('moves with Left/Right instead of expanding', async () => {
    let store = createPhotoStore({
      current: 1,
      expandable: true,
      keymap: {
        PhotoIterator: new KeyMap({ expand: 'Ctrl+ArrowRight' }),
        PhotoList: new KeyMap({ expand: 'ArrowRight', contract: 'ArrowLeft' })
      }
    })

    let { $ } = render(<PhotoGrid size={128}/>, withStore(store))

    // The grid layout is known once Scroll has measured itself.
    await waitFor(() => {
      fireEvent.keyDown($('.scroll-container'), { key: 'ArrowRight' })
      expect(store.getState().nav.photo).to.equal(2)
    })

    expect(store.getState().panel.expand[1]).to.be.undefined
  })
})
