import fp from 'fastify-plugin'
import { fail } from './errors.js'

// Formats passed on to commands as request.format.
const FORMATS = {
  'application/json': 'json',
  'text/html': 'html',
  'text/plain': 'text',
  'text/markdown': 'markdown',
  'application/xml': 'alto'
}

export default fp(async (app) => {
  app.decorateRequest('format', null)

  app.addHook('preHandler', async (request, reply) => {
    let types = request.routeOptions.schema?.produces

    if (types == null)
      return

    let type = negotiate(request.headers.accept || '*/*', types)

    reply.header('vary', 'accept')

    if (type == null)
      throw fail(406, `not acceptable, supported types: ${types.join(', ')}`)

    request.format = FORMATS[type]
    reply.type(type)
  })
}, { name: 'accept' })

// Picks the type the Accept header prefers, e.g. text/html,*/*;q=0.8.
// The most specific matching range sets each type's quality;
// ties go to the first type.
function negotiate (accept, types) {
  let ranges = accept.split(',').map(range => {
    let [type, ...params] = range.trim().toLowerCase().split(/\s*;\s*/)
    let q = params.find(param => param.startsWith('q='))
    return { type, q: q ? Number(q.slice(2)) : 1 }
  })

  let best = null
  let max = 0

  for (let type of types) {
    let [main] = type.split('/')
    let q = (
      ranges.find(range => range.type === type) ??
      ranges.find(range => range.type === `${main}/*`) ??
      ranges.find(range => range.type === '*/*')
    )?.q

    if (q > max) {
      best = type
      max = q
    }
  }

  return best
}
