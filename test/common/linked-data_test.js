'use strict'

describe('linked-data', () => {
  const ld = __require('common/linked-data')

  describe('shortenProperty', () => {
    const { shortenProperty } = ld

    const short = (str) => {
      return shortenProperty('x', { x: { label: str } })
    }

    it('argument structure', () => {
      expect(shortenProperty('x')).to.be.undefined
      expect(shortenProperty('x', {})).to.be.undefined
      expect(shortenProperty('x', { x: {} })).to.be.undefined
      expect(shortenProperty('x', { x: { label: '' } })).to.be.undefined
    })

    it('transformation', () => {
      expect(short(' F\xd6O B\xe4r ')).to.equal('fooBar')
    })
  })
})
