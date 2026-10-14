import { pluck } from '#tropy/selectors/util.js'
import { getLayout, getOffset, getRowAt } from '#tropy/components/scroll/layout.js'

describe('Scroll layout', () => {
  let ids = Array.from({ length: 20 }, (_, idx) => idx + 1)
  let items = pluck(Object.fromEntries(ids.map(id => [id, { id }])), ids)

  let layout = (props) => getLayout({
    items,
    itemHeight: 10,
    height: 50,
    overscan: 1,
    ...props
  })

  // Every item row maps back to its first item.
  let expectInverse = (geometry) => {
    let { columns } = geometry

    for (let index = 0; index < items.length; index += columns) {
      expect(getRowAt(geometry, getOffset(geometry, index)))
        .to.equal(index)
    }
  }

  it('maps offsets to rows in lists', () => {
    let geometry = layout()

    expect(getOffset(geometry, 4)).to.equal(40)
    expectInverse(geometry)
  })

  it('maps offsets to rows in grids', () => {
    let geometry = layout({
      expanded: 7,
      expansionLength: 7,
      expansionPadding: 4,
      itemWidth: 10,
      width: 50
    })

    // Two expansion rows below the second row, then the padding.
    expect(getOffset(geometry, 10)).to.equal(44)
    expectInverse(geometry)

    // The gap belongs to the expanded item's row.
    expect(getRowAt(geometry, 20)).to.equal(5)
    expect(getRowAt(geometry, 43)).to.equal(5)
  })
})
