import fp from 'fastify-plugin'

// Records the documented routes as app.catalog,
// e.g. to generate the OpenAPI spec and MCP tools.

export default fp(async (app) => {
  let catalog = []

  app.decorate('catalog', catalog)

  app.addHook('onRoute', ({ method, url, schema = {} }) => {
    if (method === 'HEAD' || schema.hide)
      return

    catalog.push({ method, url, schema })
  })
}, { name: 'catalog' })
