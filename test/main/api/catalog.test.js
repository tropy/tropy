import { logger } from '#tropy/common/log.js'
import { create } from '#tropy/main/api/api.js'
import { ProtocolHandler } from '#tropy/main/protocol.js'

// The documented routes follow the design in src/main/api/catalog.js.
describe('api.catalog', () => {
  let routes

  before(async () => {
    let app = create({
      loggerInstance: logger.child({}, { level: 'silent' }),
      projects: {},
      proto: new ProtocolHandler({}),
      wm: {}
    })

    await app.ready()
    routes = app.catalog
    await app.close()
  })

  let names = (schema) =>
    Object.keys(schema?.properties ?? {})

  let label = ({ method, url }) =>
    `${method} ${url}`

  it('records documented routes only', () => {
    expect(routes.map(label)).to.include.members(['GET /', 'GET /projects'])
    expect(routes.map(label).join()).not.to.match(/HEAD|\/project\//)
  })

  it('documents every route', () => {
    let ids = routes.map(route => route.schema.operationId)

    for (let route of routes) {
      expect(route.schema, label(route)).to.include.keys('operationId', 'summary')
    }

    expect(new Set(ids).size).to.equal(ids.length)
  })

  it('shares no operation ids with tropy:// routes', () => {
    let ids = routes.map(route => route.schema.operationId)

    for (let { operationId } of new ProtocolHandler({}).routes)
      expect(ids).not.to.include(operationId)
  })

  it('declares all path params', () => {
    for (let route of routes) {
      expect(route.url, 'optional path param').not.to.include('?')

      let params = [...route.url.matchAll(/:(\w+)/g)].map(m => m[1])
      expect(names(route.schema.params), label(route)).to.have.members(params)
    }
  })

  it('uses the query for GET and DELETE, the body for POST and PATCH', () => {
    for (let route of routes) {
      if (route.method === 'GET' || route.method === 'DELETE')
        expect(route.schema, label(route)).not.to.have.property('body')
      else
        expect(route.schema, label(route)).not.to.have.property('querystring')
    }
  })

  it('uses distinct names across path, query and body', () => {
    for (let { schema, ...route } of routes) {
      let all = [
        ...names(schema.params),
        ...names(schema.querystring),
        ...names(schema.body)
      ]

      expect(new Set(all).size, label(route)).to.equal(all.length)
    }
  })
})
