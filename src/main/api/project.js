import fp from 'fastify-plugin'
import { protocolURL } from '../../common/util.js'
import { fail, found } from './errors.js'

export default fp(async (fastify, { pm, wm }) => {
  fastify.decorateRequest('rsvp', null)

  fastify.addHook('onRequest', async (request) => {
    let id = request.params.urlId
    let path = found(pm.find(id), `unknown project: ${id}`)
    let win = pm.window(path)

    if (win == null)
      throw fail(409, `project is not open, open it with ${protocolURL(path)}`)

    let agent = request.headers['user-agent'] || 'http-api'

    request.rsvp = async (action, options) =>
      (await wm.rsvp(win, {
        ...action,
        meta: {
          ...action.meta,
          silent: true,
          agent
        }
      }, options)).payload
  })
}, { name: 'project' })
