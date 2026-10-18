import {
  getAnchoredScrollTop,
  getLayout,
  getOffset,
  getPage,
  getRowAt,
  getScrollTo
} from '#tropy/components/scroll/layout.js'

describe('Scroll layout', () => {
  let items = Array.from({ length: 20 }, (_, idx) => ({ id: idx + 1 }))

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

  describe('anchoring', () => {
    let prev = layout()
    let zoomed = layout({ itemHeight: 20 })

    // The row's center, relative to the view (50px).
    let center = (geometry, index, scrollTop) =>
      (getOffset(geometry, index) + geometry.itemHeight / 2 - scrollTop) /
      geometry.height

    it('keeps the cursor\'s row in place', () => {
      let top = getAnchoredScrollTop(prev, zoomed, 10, 80)
      expect(center(zoomed, 10, top)).to.equal(center(prev, 10, 80))
    })

    it('keeps the top row in place without the cursor in view', () => {
      let top = getAnchoredScrollTop(prev, zoomed, 1, 80)
      expect(center(zoomed, 8, top)).to.equal(center(prev, 8, 80))
    })

    it('keeps the view if the rows did not change', () => {
      expect(getAnchoredScrollTop(prev, layout({ height: 60 }), 10, 80))
        .to.be.undefined
    })
  })
  describe('scrolling into view', () => {
    let geometry = layout()

    it('keeps items in view', () => {
      expect(getScrollTo(geometry, 12, 100)).to.be.undefined
    })

    it('aligns near items to the nearest edge', () => {
      expect(getScrollTo(geometry, 16, 100)).to.equal(120)
      expect(getScrollTo(geometry, 7, 100)).to.equal(70)
    })

    it('centers far items', () => {
      expect(getScrollTo(geometry, 4, 100)).to.equal(20)
      expect(getScrollTo(geometry, 15, 0)).to.equal(130)
    })
  })

  // The page rendered for one scroll position covers the view
  // at every position within the tolerance.
  it('renders pages covering the view', () => {
    for (let overscan of [0, 0.75, 1]) {
      for (let height of [50, 55]) {
        for (let geometry of [
          layout({ height, overscan }),
          layout({
            height,
            overscan,
            expanded: 7,
            expansionLength: 7,
            expansionPadding: 4,
            itemWidth: 10,
            width: 30
          })
        ]) {
          let { length, runway, tolerance } = geometry
          let max = runway - height

          for (let pageTop = 0; pageTop <= max; pageTop++) {
            let { to, offset } = getPage(pageTop, geometry)
            let bottom = to < length ? getOffset(geometry, to) : runway

            let lo = Math.max(pageTop - tolerance, 0)
            let hi = Math.min(pageTop + tolerance, max)

            expect(offset, `${pageTop}`).to.be.at.most(lo)
            expect(bottom, `${pageTop}`).to.be.at.least(hi + height)
          }
        }
      }
    }
  })
})
