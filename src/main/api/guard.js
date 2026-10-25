import fp from 'fastify-plugin'
import { HttpError } from '../../common/error.js'

// Accepts only requests addressed to this machine (no DNS rebinding)
// and not made by web pages (no cross-site requests).
export default fp(async (app) => {
  app.addHook('onRequest', async ({ hostname, headers }) => {
    if (hostname !== '127.0.0.1' && hostname !== 'localhost')
      throw new HttpError({ status: 403, body: 'host not allowed' })

    let site = headers['sec-fetch-site']

    if (headers.origin || (site && site !== 'none'))
      throw new HttpError({
        status: 403,
        body: 'cross-origin requests not allowed'
      })
  })
}, { name: 'guard' })
