import { round } from '#tropy/common/math.js'

describe('math', () => {
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
