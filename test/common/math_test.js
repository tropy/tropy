import { round } from '../../src/common/math'

describe('math', () => {

  describe('round', () => {
    it('accepts a precision parameter', () => {
      expect(round(Math.PI)).to.equal(3)
    })
  })
})
