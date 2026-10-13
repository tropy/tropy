import { render, withStore } from '../../support/react.js'
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
})
