import { mock } from 'node:test'
import { app } from 'electron'
import { URL } from 'node:url'
import { Tropy } from '#tropy/main/tropy.js'

describe('Tropy', () => {
  let tropy

  beforeEach(() => {
    delete Tropy.instance

    tropy = new Tropy({
      data: app.getPath('userData')
    })
  })

  afterEach(() => {
    delete Tropy.instance
  })

  it('is a singleton class', () => {
    expect(tropy).to.equal(Tropy.instance)
    expect(tropy).to.equal(new Tropy())
  })

  it('hands tropy:// urls to the protocol handler', async () => {
    let handleRequest = mock.method(tropy.proto, 'handleRequest', async () => {})
    let url = new URL('tropy://about')

    await tropy.open(url)
    expect(handleRequest.mock.calls[0].arguments[0]).to.equal(url)

    handleRequest.mock.restore()
  })
})
