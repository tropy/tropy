import { mkapi } from '../../support/api.js'

describe('api /openapi.json', () => {
  let api = mkapi()

  it('is linked from the status', async () => {
    let { links } = (await api.get('/')).json()
    expect((await api.get(links['service-desc'])).statusCode).to.equal(200)
  })

  it('describes every documented route and tropy:// url', async () => {
    let spec = (await api.get('/openapi.json')).json()
    let ids = Object.values(spec.paths)
      .flatMap(path => Object.values(path))
      .map(op => op.operationId)

    expect(ids).to.have.members(api.app.catalog.map(r => r.schema.operationId))

    expect(spec.paths['/projects/{urlId}/tags/{id}'].delete.parameters[1])
      .to.include({ name: 'id', in: 'path', required: true })

    expect(spec['x-tropy-urls'].map(u => u.url))
      .to.eql(api.proto.routes.map(r => r.url))
  })
})
