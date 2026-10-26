import fp from 'fastify-plugin'
import { urlId } from '../../common/util.js'
import { fail } from './errors.js'

export default fp(async (app, { projects, wm }) => {
  app.decorateRequest('project', null)
  app.decorateRequest('rsvp', null)

  app.addHook('onRequest', async (request) => {
    let id = request.params.project
    let win = await projects.openById(id)

    if (win == null)
      throw fail(404, `unknown project: ${id}`)

    let { path } = projects.get(win)
    request.project = { id: urlId(path), path }

    request.rsvp = async (action, options) => {
      try {
        return (await wm.rsvp(win, {
          ...action,
          meta: { ...action.meta, silent: true }
        }, options)).payload
      } catch (err) {
        if (err.code === 'ETIMEDOUT')
          throw fail(504, err.message)
        if (err.code === 'ECANCELED')
          throw fail(503, err.message)
        throw err
      }
    }
  })
}, { name: 'project' })
