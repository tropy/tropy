'use strict'

describe('Tropy', () => {
  const Tropy = __require('browser/tropy')

  beforeEach(() => delete Tropy.instance)

  it('is a singleton class', () => {
    expect(new Tropy()).to.equal(new Tropy())
  })

  describe('#environment', () => {
    it('falls back to NODE_ENV', () => {
      expect(new Tropy())
        .to.have.property('environment', process.env.NODE_ENV)
    })
  })

  describe('#debug', () => {
    it('falls back to DEBUG', () => {
      expect(new Tropy())
        .to.have.property('debug', !!process.env.DEBUG)
    })
  })
})
