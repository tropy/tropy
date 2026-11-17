import {
  close, isRectangle, open, rectangle
} from '#tropy/common/geometry.js'

describe('geometry', () => {
  const TRIANGLE = [[10, 20], [40, 20], [25, 50]]
  const BOX = { x: 10, y: 20, width: 30, height: 30 }

  describe('isRectangle', () => {
    it('is true for the corners of a box in any order', () => {
      expect(isRectangle(rectangle(BOX))).to.be.true
      expect(isRectangle(rectangle(BOX).reverse())).to.be.true
    })

    it('is false otherwise', () => {
      expect(isRectangle(TRIANGLE)).to.be.false
      expect(isRectangle([[0, 0], [10, 0], [10, 10], [0, 11]])).to.be.false
      expect(isRectangle([[0, 0], [10, 10], [10, 0], [0, 10]])).to.be.false
      expect(isRectangle([[0, 0], [0, 0], [10, 10], [10, 10]])).to.be.false
    })
  })

  describe('close/open', () => {
    it('add and remove the closing vertex', () => {
      let ring = close(TRIANGLE)

      expect(ring).to.eql([...TRIANGLE, [10, 20]])
      expect(open(ring)).to.eql(TRIANGLE)
    })
  })
})
