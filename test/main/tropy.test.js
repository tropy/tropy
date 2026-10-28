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

  it('opens files by type and ignores others', async () => {
    let show = mock.method(tropy.projects, 'show', async () => {})
    let templates = mock.method(tropy, 'importTemplates', async () => {})
    let imports = mock.method(tropy, 'import', () => {})
    mock.method(tropy.wm, 'current', () => ({}))

    await tropy.open(...[
      '/a.tropy', '/b.TPY', '/c.ttp', '/d.jpg', '/e.txt', '/f', '/g.mtpy'
    ].map(path => new URL(`file://${path}`)))

    expect(show.mock.calls.map(c => c.arguments[0])).to.eql(['/a.tropy', '/b.TPY'])
    expect(templates.mock.calls[0].arguments[0]).to.eql(['/c.ttp'])
    expect(imports.mock.calls.map(c => c.arguments[0])).to.eql([{ files: ['/d.jpg'] }])

    mock.restoreAll()
  })
})
