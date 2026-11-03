import { channel, product, version } from '../../../common/release.js'

const API_VERSION = 1

export default async function status (fastify, { locale }) {
  fastify.get('/', {
    schema: {
      operationId: 'status',
      summary: 'Show the API status'
    }
  }, () => ({
    status: 'ok',
    name: product,
    version,
    channel,
    apiVersion: API_VERSION,
    locale: locale(),
    links: { 'service-desc': '/openapi.json' }
  }))
}
