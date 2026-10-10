import { render, inWindowContext } from '../../support/react.js'
import { PhotoTile } from '#tropy/components/photo/tile.js'

describe('PhotoTile', () => {
  const photo = { id: 1, item: 1, selections: [2] }

  it('renders a selected, expandable photo tile', () => {
    expect(
      render(
        <PhotoTile photo={photo} isSelected isExpandable/>,
        inWindowContext
      ).element())
      .to.have.class('photo')
      .and.have.class('tile')
      .and.have.class('active')
      .and.have.class('expandable')
  })
})
