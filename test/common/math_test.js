import { round } from '../../src/common/math.js'

describe('math', () => {

  describe('round', () => {
    it('accepts a precision parameter', () => {
      expect(round(Math.PI)).to.equal(3)
    })
  })
})
