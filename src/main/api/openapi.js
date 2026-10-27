import { product, version } from '../../common/release.js'

// Serves the OpenAPI description of the documented routes,
// and of the tropy:// URLs as x-tropy-urls.
export default async function openapi (fastify, { proto }) {
  let spec

  fastify.get('/openapi.json', { schema: { hide: true } }, () =>
    (spec ??= build(fastify.catalog, proto.routes)))
}

function build (routes, urls) {
  let paths = {}

  for (let { method, url, schema } of routes) {
    let path = url.replace(/:(\w+)/g, '{$1}')

    paths[path] ??= {}
    paths[path][method.toLowerCase()] = {
      operationId: schema.operationId,
      summary: schema.summary,
      description: schema.description,
      parameters: [
        ...parameters('path', schema.params),
        ...parameters('query', schema.querystring)
      ],
      requestBody: schema.body && {
        required: true,
        content: { 'application/json': { schema: schema.body } }
      },
      responses: {
        '2XX': {
          description: 'Success',
          content: Object.fromEntries(
            (schema.produces ?? ['application/json']).map(type => [type, {}]))
        },
        default: {
          description: 'Problem details (RFC 9457)',
          content: { 'application/problem+json': {} }
        }
      }
    }
  }

  return {
    openapi: '3.1.0',
    info: { title: `${product} API`, version },
    paths,
    'x-tropy-urls': urls.map(({ url, operationId, summary, params, query }) =>
      ({ url, operationId, summary, params, query }))
  }
}

function parameters (location, schema) {
  return Object.entries(schema?.properties ?? {}).map(([name, value]) => ({
    name,
    in: location,
    required: location === 'path' || !!schema.required?.includes(name),
    description: value.description,
    schema: value
  }))
}
