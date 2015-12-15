'use strict'

describe('Tropy', () => {
  const Tropy = __require('browser/tropy')

  it('is a singleton class', () => {
    expect(new Tropy()).to.equal(new Tropy())
  })
})
