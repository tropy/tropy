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
    expansionPadding: 0,
    ...props
  })

  // Every item row and expansion row maps back to its item.
  let expectInverse = (geometry) => {
    let { columns, expandedRows } = geometry

    for (let index = 0; index < items.length; index += columns) {
      let numRows = expandedRows
        .filter(row => row.index === index / columns).length

      for (let exp = 0; exp <= numRows; ++exp) {
        expect(getRowAt(geometry, getOffset(geometry, index, exp)))
          .to.eql([index, exp])
      }
    }
  }

  it('maps offsets to rows in lists', () => {
    let geometry = layout({ expandedItems: { 4: [101, 102], 9: [103] } })

    expect(getOffset(geometry, 3, 2)).to.equal(50)
    expect(getOffset(geometry, 4)).to.equal(60)
    expectInverse(geometry)
  })

  it('maps offsets to rows in grids', () => {
    let geometry = layout({
      expandedItems: { 7: Array.from({ length: 7 }, (_, i) => 101 + i) },
      expansionPadding: 4,
      itemWidth: 10,
      width: 50
    })

    // Two expansion rows below the second row, then the padding.
    expect(getOffset(geometry, 10)).to.equal(44)
    expectInverse(geometry)
  })
})
