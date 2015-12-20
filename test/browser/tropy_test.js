'use strict'

describe('Tropy', () => {
  const Tropy = __require('browser/tropy')

  beforeEach(() => delete Tropy.instance)

  it('is a singleton class', () => {
    expect(new Tropy()).to.equal(new Tropy())
  })

  describe('#environment', () => {
    it('falls back to node env', () => {
      expect(new Tropy()).to.have.property('environment', 'test')

      expect(new Tropy()).to.have.property('production', false)
      expect(new Tropy()).to.have.property('development', false)
    })

    it('can be set on create', () => {
      expect(new Tropy({ environment: 'production' }))
        .to.have.property('environment', 'production')

      expect(new Tropy()).to.have.property('production', true)
      expect(new Tropy()).to.have.property('development', false)
    })
  })

  describe('#debug', () => {
    it('false by default', () => {
      expect(new Tropy().debug).to.be.falsy
    })

    it('can be set on create', () => {
      expect(new Tropy({ debug: true })).to.have.property('debug', true)
    })
  })
})
