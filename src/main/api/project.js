import fp from 'fastify-plugin'
import { HttpError } from '../../common/error.js'

// Resolves the :project route param and gives routes access to
// the project's window: request.rsvp(action) dispatches the action
// to the window and resolves with the window's response payload.
export default fp(async (app, { resolveProject, rsvp }) => {
  app.decorateRequest('project', null)
  app.decorateRequest('rsvp', null)

  app.addHook('onRequest', async (request, reply) => {
    let id = request.params.project
    let { win, path, id: resolved, ambiguous } = resolveProject(id)

    if (ambiguous)
      reply.header('Warning',
        `199 - "ambiguous project URL '${resolved}'; opened the most recent ` +
        'match, consider renaming a project"')

    request.project = {
      id: resolved,
      path
    }

    request.rsvp = async (action, options) => {
      try {
        return (await rsvp(win, {
          ...action,
          meta: { ...action.meta, silent: true }
        }, options)).payload
      } catch (err) {
        if (err.code === 'ETIMEDOUT')
          throw new HttpError({ status: 504, body: err.message })
        if (err.code === 'ECANCELED')
          throw new HttpError({ status: 503, body: err.message })
        throw err
      }
    }
  })
}, { name: 'project' })
