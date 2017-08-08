'use strict'

describe('math', () => {
  const math = __require('common/math')

  describe('round', () => {
    const { round } = math

    it('accepts a precision parameter', () => {
      expect(round(Math.PI)).to.equal(3)
    })
  })
})
