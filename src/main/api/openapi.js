import { product, version } from '../../common/release.js'
import { pick } from '../../common/util.js'

// Serves the OpenAPI description of all pertinent API routes,
// and of the tropy:// URLs as x-tropy-urls.
export default async function openapi (fastify, { proto }) {
  let spec

  fastify.get('/openapi.json', {
    schema: {
      hide: true
    }
  }, () => (
    spec ??= describe(fastify.catalog, proto.routes)
  ))
}

function describe (apiRoutes, protoRoutes) {
  let paths = {}

  for (let { method, url, schema } of apiRoutes) {
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
    'x-tropy-urls': protoRoutes.map((route) => pick(route, [
      'url',
      'operationId',
      'summary',
      'params',
      'query'
    ]))
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
