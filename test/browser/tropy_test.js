import { app } from 'electron'
import { Tropy } from '../../src/browser/tropy'

describe('Tropy', () => {
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
