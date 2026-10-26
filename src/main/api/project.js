import fp from 'fastify-plugin'
import { fail } from './errors.js'

// Resolves the :project route param and gives routes access to
// the project's window: request.rsvp(action) dispatches the action
// to the window and resolves with the window's response payload.
export default fp(async (app, { resolveProject, rsvp }) => {
  app.decorateRequest('project', null)
  app.decorateRequest('rsvp', null)

  app.addHook('onRequest', async (request) => {
    let { win, path, id } = resolveProject(request.params.project)

    request.project = { id, path }

    request.rsvp = async (action, options) => {
      try {
        return (await rsvp(win, {
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
