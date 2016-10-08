'use strict'

describe('Tropy', () => {
  const Tropy = __require('browser/tropy')

  beforeEach(() => delete Tropy.instance)

  it('is a singleton class', () => {
    expect(new Tropy()).to.equal(new Tropy())
  })

})
