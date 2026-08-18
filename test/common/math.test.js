import { contains, round } from '#tropy/common/math.js'

describe('math', () => {
  describe('contains', () => {
    const rect = { left: 10, top: 10, right: 90, bottom: 90 }

    it('accepts points', () => {
      expect(contains(rect, { x: 50, y: 50 })).to.be.true
      expect(contains(rect, { x: 10, y: 90 })).to.be.true
      expect(contains(rect, { x: 5, y: 50 })).to.be.false
      expect(contains(rect, { x: 50, y: 95 })).to.be.false
    })

    it('accepts rectangles in left/top/right/bottom form', () => {
      expect(contains(rect, { left: 20, top: 20, right: 30, bottom: 30 }))
        .to.be.true
      expect(contains(rect, rect)).to.be.true
      expect(contains(rect, { left: 20, top: 85, right: 30, bottom: 95 }))
        .to.be.false
      expect(contains(rect, { left: 5, top: 20, right: 30, bottom: 30 }))
        .to.be.false
    })

    it('accepts rectangles in x/y/width/height form', () => {
      expect(contains(rect, { x: 20, y: 20, width: 10, height: 10 }))
        .to.be.true
      expect(contains(rect, { x: 20, y: 85, width: 10, height: 10 }))
        .to.be.false
    })
  })

  describe('round', () => {
    it('rounds to integer', () => {
      expect(round(Math.PI)).to.equal(3)
    })

    it('accepts precision parameter', () => {
      expect(round(Math.PI, 100)).to.equal(3.14)
      expect(round(Math.PI, 1000)).to.equal(3.142)
    })
  })
})
