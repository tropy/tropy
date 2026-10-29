import { existsSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fail, found } from '../errors.js'
import { object, withUrlId } from '../schema.js'

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
      operationId: 'projects.create',
      summary: 'Create a project and open it',
      description: 'Like New Project in the app. ' +
        'Managed projects end in .tropy, standard projects in .tpy.',
      body: object({
        path: {
          type: 'string',
          pattern: '[^/\\\\]\\.(tropy|tpy)$',
          description: 'Absolute path of the new project file'
        },
        name: {
          type: 'string',
          minLength: 1,
          description: 'Project name; defaults to the file name'
        }
      }, ['path'])
    }
  }, async ({ body }, reply) => {
    if (!isAbsolute(body.path))
      throw fail(400, `path must be absolute: ${body.path}`)

    let path = resolve(body.path)

    if (existsSync(path))
      throw fail(409, `file exists: ${path}`)
    if (!existsSync(dirname(path)))
      throw fail(400, `folder does not exist: ${dirname(path)}`)

    await pm.open(path, {
      create: { name: body.name },
      silent: true
    })

    let project = pm.describe(path)

    reply.code(201).header('location', `/projects/${project.urlId}`)
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
