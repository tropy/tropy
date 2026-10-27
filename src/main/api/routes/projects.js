import { fail } from '../errors.js'
import { path } from '../schema.js'

// The known projects, open or not. Projects that are not open
// can be opened via their tropy:// url.
export default async function projects (api, { projects: registry }) {
  api.get('/projects', {
    schema: {
      operationId: 'projects.list',
      summary: 'List the known projects',
      description: 'Most recently opened first.'
    }
  }, () =>
    registry.list())

  api.get('/projects/:project', {
    schema: {
      operationId: 'projects.show',
      summary: 'Show a known project',
      params: path()
    }
  }, ({ params }) => {
    let path = registry.find(params.project)

    if (path == null)
      throw fail(404, `unknown project: ${params.project}`)

    return registry.describe(path)
  })
}
