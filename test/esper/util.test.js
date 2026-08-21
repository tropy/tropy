import {
  centerOffset, inset, intersects, intoView, textBounds, union
} from '#tropy/esper/util.js'

describe('esper/util', () => {
  const view = { left: 10, top: 10, right: 90, bottom: 90 }

  describe('inset', () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 }

    it('converts a rectangle, adding padding', () => {
      expect(inset(rect, 10)).to.eql(view)
    })

    it('converts a rectangle without padding', () => {
      expect(inset(rect))
        .to.eql({ left: 0, top: 0, right: 100, bottom: 100 })
    })

    it('accepts padding for individual edges', () => {
      expect(inset(rect, { top: 10 }))
        .to.eql({ left: 0, top: 10, right: 100, bottom: 100 })
      expect(inset(rect, { top: 1, right: 2, bottom: 3, left: 4 }))
        .to.eql({ left: 4, top: 1, right: 98, bottom: 97 })
    })
  })

  describe('intoView', () => {
    const rect = (left, top, right, bottom) => ({ left, top, right, bottom })

    it('does not move positions which are in view', () => {
      expect(intoView({ x: 0, y: 0 }, rect(20, 20, 30, 30), view))
        .to.eql({ x: 0, y: 0 })
      expect(intoView({ x: 0, y: 0 }, rect(10, 10, 90, 90), view))
        .to.eql({ x: 0, y: 0 })
    })

    it('moves the nearest edge into view', () => {
      expect(intoView({ x: 5, y: 5 }, rect(-10, 100, 0, 110), view))
        .to.eql({ x: 25, y: -15 })
    })

    it('centers rectangles which do not fit', () => {
      expect(intoView({ x: 0, y: 0 }, rect(0, 0, 200, 200), view))
        .to.eql({ x: -50, y: -50 })
    })

    it('snaps to whole pixels', () => {
      expect(intoView({ x: 0, y: 0 }, rect(0, 0, 201, 201), view))
        .to.eql({ x: -50, y: -50 })
      expect(intoView({ x: 5.5, y: 5.5 }, rect(20, 20, 30, 30), view))
        .to.eql({ x: 6, y: 6 })
    })
  })

  describe('textBounds', () => {
    const node = (bounds) => ({ bounds: () => bounds })

    it('normalizes the bounds of the node', () => {
      expect(textBounds(node({ x: 30, y: 20, width: -10, height: -5 })))
        .to.eql({ x: 20, y: 15, width: 10, height: 5 })
    })

    it('works without an offset', () => {
      let bounds = { x: 5, y: 7, width: 20, height: 10 }

      expect(textBounds(node(bounds), null)).to.eql(bounds)
      expect(textBounds(node(bounds))).to.eql(bounds)
    })

    it('returns null for nodes without coordinates', () => {
      expect(textBounds(node(null))).to.be.null
      expect(textBounds(node(null), { x: 100, y: 200 })).to.be.null
    })

    it('adds the offset of the photo selection', () => {
      expect(textBounds(
        node({ x: 5, y: 7, width: 20, height: 10 }),
        { x: 100, y: 200 }
      ))
        .to.eql({ x: 105, y: 207, width: 20, height: 10 })
    })
  })
  describe('intersects', () => {
    const rect = { x: 10, y: 10, width: 10, height: 10 }

    it('detects overlapping rectangles', () => {
      expect(intersects(rect, { x: 15, y: 15, width: 10, height: 10 }))
        .to.be.true
      expect(intersects(rect, { x: 0, y: 0, width: 100, height: 100 }))
        .to.be.true
    })

    it('detects rectangles which merely touch', () => {
      expect(intersects(rect, { x: 20, y: 20, width: 10, height: 10 }))
        .to.be.true
    })

    it('rejects disjoint rectangles', () => {
      expect(intersects(rect, { x: 21, y: 10, width: 10, height: 10 }))
        .to.be.false
      expect(intersects(rect, { x: 10, y: 21, width: 10, height: 10 }))
        .to.be.false
    })

    it('treats rectangles without extent as points', () => {
      expect(intersects({ x: 15, y: 15 }, rect)).to.be.true
      expect(intersects({ x: 25, y: 15 }, rect)).to.be.false
    })
  })

  describe('union', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 }
    const b = { x: 20, y: 5, width: 10, height: 10 }

    it('covers both rectangles', () => {
      expect(union(a, b)).to.eql({ x: 0, y: 0, width: 30, height: 15 })
    })

    it('covers contained rectangles', () => {
      expect(union(a, { x: 2, y: 2, width: 1, height: 1 })).to.eql(a)
    })

    it('ignores missing rectangles', () => {
      expect(union(null, b)).to.eql(b)
      expect(union(a, null)).to.eql(a)
      expect(union(null, null)).to.be.null
    })
  })

  describe('centerOffset', () => {
    const rect = { x: 0, y: 0, width: 100, height: 10 }

    it('is zero at the center', () => {
      expect(centerOffset({ x: 50, y: 5 }, rect)).to.eql({ dx: 0, dy: 0 })
    })

    it('is one at the edges', () => {
      expect(centerOffset({ x: 100, y: 10 }, rect)).to.eql({ dx: 1, dy: 1 })
      expect(centerOffset({ x: 0, y: 0 }, rect)).to.eql({ dx: -1, dy: -1 })
    })

    it('scales each axis by the extent', () => {
      // Subtle: the same distance counts for more vertically, because
      // the rectangle is flat!
      expect(centerOffset({ x: 55, y: 10 }, rect))
        .to.eql({ dx: 0.1, dy: 1 })
    })

    it('survives rectangles without extent', () => {
      expect(centerOffset({ x: 5, y: 5 }, { x: 0, y: 0, width: 0, height: 0 }))
        .to.eql({ dx: 5, dy: 5 })
    })
  })
})
