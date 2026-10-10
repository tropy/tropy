import { render, inWindowContext } from '../../support/react.js'
import { PhotoGrid } from '#tropy/components/photo/grid.js'

describe('PhotoGrid', () => {
  const photos = [
    { id: 1, item: 1, selections: [] },
    { id: 2, item: 1, selections: [] }
  ]

  it('renders photos', () => {
    expect(
      render(
        <PhotoGrid photos={photos} expandedPhotos={{}} size={128}/>,
        inWindowContext
      ).element())
      .to.have.class('photo-grid')
      .and.have.descendants('li.photo').with.length(2)
  })
})
