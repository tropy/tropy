'use strict'

const { app } = require('electron')

describe('Tropy', () => {
  const Tropy = __require('browser/tropy')

  beforeEach(() => delete Tropy.instance)
  afterEach(() => delete Tropy.instance)

  it('is a singleton class', () => {
    let tropy = new Tropy({
      data: app.getPath('userData')
    })

    expect(tropy).to.equal(Tropy.instance)
    expect(tropy).to.equal(new Tropy())
  })
})
