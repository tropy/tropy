import fp from 'fastify-plugin'
import { fail } from './errors.js'

export default fp(async (app, { projects, wm }) => {
  app.decorateRequest('project', null)
  app.decorateRequest('rsvp', null)

  app.addHook('onRequest', async (request) => {
    let id = request.params.urlId
    let path = projects.find(id)

    if (path == null)
      throw fail(404, `unknown project: ${id}`)

    let win = projects.window(path)
    let project = projects.describe(path)

    if (win == null)
      throw fail(409, `project is not open, open it with ${project.url}`)

    request.project = project

    let agent = request.headers['user-agent'] || 'http-api'

    request.rsvp = async (action, options) => {
      try {
        return (await wm.rsvp(win, {
          ...action,
          meta: {
            ...action.meta,
            silent: true,
            agent
          }
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
