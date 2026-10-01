import { render, inWindowContext } from '../../support/react.js'
import { ItemTile } from '#tropy/components/item/tile.js'

describe('ItemTile', () => {
  const item = { id: 1, photos: [], tags: [] }

  it('renders a selected item tile', () => {
    expect(
      render(
        <ItemTile item={item} isSelected isLast/>,
        inWindowContext
      ).element())
      .to.have.class('item')
      .and.have.class('tile')
      .and.have.class('active')
      .and.have.class('last')
  })
})
