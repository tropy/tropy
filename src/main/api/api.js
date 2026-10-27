import Ajv from 'ajv'
import Fastify, { LogController } from 'fastify'
import { channel, product, version } from '../../common/release.js'
import accept from './accept.js'
import catalog from './catalog.js'
import errors from './errors.js'
import guard from './guard.js'
import legacy from './legacy.js'
import mcp from './mcp.js'
import project from './project.js'
import { validation } from './schema.js'
import projectsRoutes from './routes/projects.js'
import items from './routes/items.js'
import lists from './routes/lists.js'
import metadata from './routes/metadata.js'
import notes from './routes/notes.js'
import photos from './routes/photos.js'
import tags from './routes/tags.js'
import transcriptions from './routes/transcriptions.js'

const API_VERSION = 1

export function create ({
  loggerInstance,
  projects,
  proto,
  wm
}) {
  let app = Fastify({
    forceCloseConnections: true,
    loggerInstance,
    logController: new DebugLogger()
  })

  let ajv = {
    body: new Ajv(validation.body),
    strings: new Ajv(validation.strings)
  }

  app.setValidatorCompiler(({ schema, httpPart }) =>
    (httpPart === 'body' ? ajv.body : ajv.strings).compile(schema))

  app.register(catalog)
  app.register(errors)
  app.register(accept)
  app.register(guard)
  app.register(legacy)
  app.register(projectsRoutes, { projects })
  app.register(mcp, { proto })

  app.register(async (api) => {
    api.register(project, { projects, wm })

    // Commands without results respond with No Content.
    api.addHook('onSend', async (request, reply, payload) => {
      if (payload === undefined && reply.statusCode === 200)
        reply.code(204)
    })

    api.register(items)
    api.register(lists)
    api.register(tags)
    api.register(metadata)
    api.register(notes)
    api.register(transcriptions)
    api.register(photos)
  }, { prefix: '/projects/:urlId' })

  app.register(async (fastify) => {
    fastify.get('/', {
      schema: {
        operationId: 'status',
        summary: 'Show the API status'
      }
    }, () => ({
      status: 'ok',
      name: product,
      version,
      channel,
      apiVersion: API_VERSION
    }))
  })

  return app
}

class DebugLogger extends LogController {
  incomingRequest () {}

  requestCompleted (error, request, reply) {
    request.log.debug({
      ms: Math.round(reply.elapsedTime),
      status: reply.statusCode,
      method: request.method,
      query: request.query,
      url: request.url
    })
  }
}
