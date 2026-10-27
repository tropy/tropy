import fp from 'fastify-plugin'

// Records the documented routes as fastify.catalog,
// e.g. to generate the OpenAPI spec and MCP tools.

export default fp(async (fastify) => {
  let catalog = []

  fastify.decorate('catalog', catalog)

  fastify.addHook('onRoute', ({ method, url, schema = {} }) => {
    if (method === 'HEAD' || schema.hide)
      return

    catalog.push({ method, url, schema })
  })
}, { name: 'catalog' })
