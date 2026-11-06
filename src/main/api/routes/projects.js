import { existsSync } from 'node:fs'
import { dirname, isAbsolute } from 'node:path'
import { fail, found } from '../errors.js'
import { object, withUrlId } from '../schema.js'
import { projectPath } from '../../../common/project-file.js'

export default async function projects (fastify, { pm }) {
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
    pm.list().filter(project =>
      query.open == null || project.open === query.open))

  fastify.post('/projects', {
    schema: {
      operationId: 'projects.open',
      summary: 'Open a project, or create a new one',
      description: 'Like Open and New Project in the app. ' +
        'A project that is open already is returned as it is. ' +
        'Managed projects end in .tropy, standard projects in .tpy.',
      body: object({
        path: {
          type: 'string',
          pattern: '[^/\\\\]\\.(tropy|tpy)$',
          description: 'Absolute path of the project file'
        },
        create: {
          type: 'boolean',
          description: 'Create a new project; fails if the file exists'
        },
        name: {
          type: 'string',
          minLength: 1,
          description: 'Name of a new project; defaults to the file name'
        }
      }, ['path'])
    }
  }, async ({ body }, reply) => {
    if (!isAbsolute(body.path))
      throw fail(400, `path must be absolute: ${body.path}`)
    if (body.name != null && !body.create)
      throw fail(400, 'name is only for new projects: use create')

    let path = projectPath(body.path)

    if (body.create) {
      if (existsSync(path))
        throw fail(409, `file exists: ${path}`)
      if (!existsSync(dirname(path)))
        throw fail(400, `folder does not exist: ${dirname(path)}`)

      await pm.open(path, {
        create: { name: body.name },
        silent: true
      })

      reply.code(201)

    } else {
      if (!existsSync(path))
        throw fail(404, `no project at ${path}`)

      if (pm.window(path) == null)
        await pm.open(path, { silent: true })
    }

    let project = pm.describe(path)

    reply.header('location', `/projects/${encodeURIComponent(project.urlId)}`)
    return project
  })

  fastify.get('/projects/:urlId', {
    schema: {
      operationId: 'projects.show',
      summary: 'Show a known project',
      params: withUrlId()
    }
  }, ({ params }) =>
    pm.describe(found(pm.find(params.urlId), `unknown project: ${params.urlId}`)))
}
