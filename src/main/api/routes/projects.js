import { fail } from '../errors.js'
import { withUrlId } from '../schema.js'

// The known projects, open or not.
// Projects that are not open can be opened via their tropy:// url.
export default async function projects (api, { projects: registry }) {
  api.get('/projects', {
    schema: {
      operationId: 'projects.list',
      summary: 'List the known projects',
      description: 'Most recently opened first.'
    }
  }, () =>
    registry.list())

  api.get('/projects/:urlId', {
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
