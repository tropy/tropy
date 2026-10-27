import { fail } from '../errors.js'
import { object, withUrlId } from '../schema.js'

// The known projects, open or not.
// Projects that are not open can be opened via their tropy:// url.
export default async function projects (fastify, { projects: registry }) {
  fastify.get('/projects', {
    schema: {
      operationId: 'projects.list',
      summary: 'List the known projects',
      description: 'Most recently opened first.',
      querystring: object({
        open: {
          type: 'boolean',
          description: 'Only open (true) or closed (false) projects'
        }
      })
    }
  }, ({ query }) =>
    registry.list().filter(project =>
      query.open == null || project.open === query.open))

  fastify.get('/projects/:urlId', {
    schema: {
      operationId: 'projects.show',
      summary: 'Show a known project',
      params: withUrlId()
    }
  }, ({ params }) => {
    let path = registry.find(params.urlId)

    if (path == null)
      throw fail(404, `unknown project: ${params.urlId}`)

    return registry.describe(path)
  })
}
