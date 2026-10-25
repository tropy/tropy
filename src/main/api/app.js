import fs from 'node:fs'
import { basename } from 'node:path'
import Ajv from 'ajv'
import Fastify, { LogController } from 'fastify'
import act from '../../actions/api.js'
import { MIME } from '../../constants/index.js'
import { HttpError } from '../../common/error.js'
import accept from './accept.js'
import errors from './errors.js'
import guard from './guard.js'
import legacy from './legacy.js'
import project from './project.js'

const fail = (status, body) =>
  new HttpError({ status, body })

const found = (payload) => {
  if (payload == null)
    throw fail(404, 'not found')
  return payload
}

const id = { type: 'integer', minimum: 1 }
const ids = { type: 'array', items: id }

// List id 0 is the root list.
const list = { type: 'integer', minimum: 0 }
const strings = { type: 'array', items: { type: 'string' } }

// Rejects unknown properties.
const object = (properties, required) => ({
  type: 'object',
  properties,
  additionalProperties: false,
  ...(required && { required })
})

// Requires at least one of the properties.
const some = (...names) => ({
  anyOf: names.map(name => ({ required: [name] }))
})

// Requires exactly one of the properties.
const one = (...names) => ({
  oneOf: names.map(name => ({ required: [name] }))
})

// Not strict, because route params include the :project param.
const path = (properties) => ({ type: 'object', properties })

const params = path({ id })

const show = (type) => ({
  schema: { params },
  async handler ({ params, rsvp }) {
    return found(await rsvp(act[type].show({ id: params.id })))
  }
})

const extract = (type) => ({
  schema: {
    params: path({ id, format: { enum: ['jpg', 'png', 'webp', 'raw'] } })
  },
  async handler ({ params, rsvp }, reply) {
    let payload = found(await rsvp(act.photo.extract({
      [type]: params.id,
      format: params.format
    })))

    return reply
      .type(MIME[payload.format.toUpperCase()] || 'application/octet-stream')
      .send(Buffer.from(payload.data))
  }
})

// Shared by /items and /lists/:id/items
const findItems = {
  schema: {
    params,
    querystring: object({
      tag: ids,
      q: { type: 'string' },
      sort: { type: 'string', default: 'item.created' },
      reverse: { type: 'boolean', default: false }
    })
  },
  async handler ({ params, query, rsvp }) {
    return rsvp(act.item.find({
      tags: query.tag,
      list: params.id,
      sort: { column: query.sort, asc: !query.reverse },
      query: query.q
    }))
  }
}

export function create ({
  current,
  log,
  resolveProject,
  rsvp,
  version
}) {
  let app = Fastify({
    loggerInstance: log,
    logController: new Logging()
  })

  // Coerce only query strings and params, because their values are strings.
  // JSON bodies must use the right types.
  let options = { allErrors: true, allowUnionTypes: true, useDefaults: true }
  let ajv = {
    body: new Ajv(options),
    strings: new Ajv({ ...options, coerceTypes: 'array' })
  }

  app.setValidatorCompiler(({ schema, httpPart }) =>
    (httpPart === 'body' ? ajv.body : ajv.strings).compile(schema))

  app.register(errors)
  app.register(accept)
  app.register(guard)
  app.register(legacy)

  app.register(async (api) => {
    await api.register(project, { resolveProject, rsvp })

    // Commands without results respond with No Content.
    api.addHook('onSend', async (request, reply, payload) => {
      if (payload === undefined && reply.statusCode === 200)
        reply.code(204)
    })

    api.get('/', ({ project }) => ({
      project: project.path,
      id: project.id,
      status: 'ok',
      version
    }))

    // Import

    api.post('/import', {
      bodyLimit: 16 * 1024 * 1024,
      schema: {
        body: {
          ...object({
            files: strings,
            list: id,
            data: { type: ['object', 'array'], items: { type: 'object' } },
            createLists: { type: 'boolean' },
            tagColor: { type: 'string' }
          }),
          ...some('files', 'data')
        }
      }
    }, async ({ body, rsvp }, reply) => {
      let { files, list, data, createLists, tagColor } = body

      // Imports can take a long time: wait without a timeout.
      let payload = await rsvp(act.import({
        data,
        files,
        list
      }, {
        createLists,
        tagColor
      }), { timeout: 0 })

      return reply.code(201).send(payload)
    })

    // Items

    api.get('/items', findItems)
    api.get('/items/:id', show('item'))

    api.get('/items/:id/photos', { schema: { params } }, async ({ params, rsvp }) =>
      found(await rsvp(act.photo.find({ item: params.id }))))

    api.get('/items/:id/tags', {
      schema: {
        params,
        querystring: object({ reverse: { type: 'boolean' } })
      }
    }, async ({ params, query, rsvp }) =>
      found(await rsvp(act.tag.find({
        id: params.id,
        reverse: query.reverse
      }))))

    api.post('/items/:id/tags', {
      schema: {
        params,
        body: object({ tags: strings }, ['tags'])
      }
    }, async ({ body, params, rsvp }) =>
      rsvp(act.tag.add({ id: params.id, tags: body.tags })))

    // Removes the given tags, or all tags without a tag param.
    api.delete('/items/:id/tags', {
      schema: {
        params,
        querystring: object({ tag: strings })
      }
    }, async ({ params, query, rsvp }) =>
      rsvp(query.tag ?
        act.tag.remove({ id: params.id, tags: query.tag }) :
        act.tag.clear({ id: params.id })))

    api.get('/items/:id/transcriptions', {
      config: { formats: ['json', 'html', 'text'] },
      schema: {
        params,
        querystring: object({
          separator: { type: 'string', pattern: '^[*_=-]+$' }
        })
      }
    }, async ({ format, params, query, rsvp }) =>
      found(await rsvp(act.transcription.find({
        id: params.id,
        format,
        separator: query.separator
      }))))

    // Lists

    api.get('/lists/:id?', {
      schema: {
        params: path({ id: list }),
        querystring: object({ expand: { type: 'boolean', default: false } })
      }
    }, async ({ params, query, rsvp }) =>
      found(await rsvp(act.list.show({
        id: params.id ?? 0,
        expand: query.expand
      }))))

    api.post('/lists', {
      schema: {
        body: object({
          name: { type: 'string', minLength: 1 },
          parent: { ...list, default: 0 }
        }, ['name'])
      }
    }, async ({ body, rsvp }, reply) =>
      reply.code(201).send(await rsvp(act.list.create(body))))

    api.get('/lists/:id/items', findItems)

    api.post('/lists/:id/items', {
      schema: {
        params,
        body: object({ items: ids }, ['items'])
      }
    }, async ({ body, params, rsvp }) =>
      rsvp(act.list.items.add({ id: params.id, ...body })))

    // Tags

    // Tags can be looked up by name, e.g. /tags?name=Foo.
    api.get('/tags', {
      schema: {
        querystring: object({
          name: { type: 'string', minLength: 1 },
          reverse: { type: 'boolean' }
        })
      }
    }, async ({ query, rsvp }) => {
      if (query.name == null)
        return rsvp(act.tag.find({ reverse: query.reverse }))

      let tag = await rsvp(act.tag.show({ name: query.name }))
      return tag ? [tag] : []
    })

    api.get('/tags/:id', show('tag'))

    api.post('/tags', {
      schema: {
        body: object({
          name: { type: 'string', minLength: 1 },
          color: { type: 'string' },
          items: ids
        }, ['name'])
      }
    }, async ({ body, rsvp }, reply) =>
      reply.code(201).send(await rsvp(act.tag.create(body))))

    api.delete('/tags', {
      schema: {
        querystring: object({ tag: strings }, ['tag'])
      }
    }, async ({ query, rsvp }) =>
      rsvp(act.tag.delete(query.tag)))

    // Metadata

    api.get('/data/:id', show('metadata'))

    api.patch('/data/:id', {
      schema: {
        params,
        body: { type: 'object', minProperties: 1 }
      }
    }, async ({ body, params, rsvp }) =>
      rsvp(act.metadata.save({ id: params.id, data: body })))

    // Notes

    api.get('/notes/:id', {
      config: { formats: ['json', 'html', 'text', 'markdown'] },
      schema: { params }
    }, async ({ format, params, rsvp }) =>
      found(await rsvp(act.note.show({ id: params.id, format }))))

    api.post('/notes', {
      schema: {
        body: {
          ...object({
            html: { type: 'string', minLength: 1 },
            photo: id,
            selection: id
          }, ['html']),
          ...one('photo', 'selection')
        }
      }
    }, async ({ body, rsvp }, reply) => {
      let payload = found(await rsvp(act.note.create(body)))

      return reply.code(201).send({
        id: Object.values(payload).map(note => note.id)
      })
    })

    api.delete('/notes/:id', { schema: { params } }, async ({ params, rsvp }) => {
      let payload = await rsvp(act.note.delete([params.id]))

      if (payload.length === 0)
        throw fail(404, 'not found')
    })

    // Transcriptions

    api.get('/transcriptions/:id', {
      config: { formats: ['json', 'html', 'text', 'alto'] },
      schema: { params }
    }, async ({ format, params, rsvp }) =>
      found(await rsvp(act.transcription.show({ id: params.id, format }))))

    api.post('/transcriptions', {
      schema: {
        body: {
          ...object({
            data: { type: 'string' },
            text: { type: 'string' },
            angle: { type: 'number' },
            mirror: { type: 'boolean' },
            photo: id,
            selection: id
          }),
          allOf: [some('data', 'text'), one('photo', 'selection')]
        }
      }
    }, async ({ body, rsvp }, reply) => {
      let payload = found(await rsvp(act.transcription.create(body)))

      return reply.code(201).send({
        id: Object.values(payload).map(tr => tr.id)
      })
    })

    // Photos

    api.get('/photos/:id', show('photo'))
    api.get('/photos/:id/file.:format', extract('photo'))

    api.get('/photos/:id/raw', { schema: { params } }, async ({ params, rsvp }, reply) => {
      let { protocol, path, mimetype } =
        found(await rsvp(act.photo.show({ id: params.id })))

      switch (protocol) {
        case 'file': {
          let stats = await fs.promises.stat(path).catch(err => {
            if (err.code !== 'ENOENT') throw err
          })

          if (!stats?.isFile())
            throw fail(404, 'not found')

          return reply
            .header('content-length', stats.size)
            .header('last-modified', new Date(stats.mtimeMs).toUTCString())
            .header('content-disposition',
              `attachment; filename*=UTF-8''${encodeURIComponent(basename(path))}`)
            .type(mimetype || 'application/octet-stream')
            .send(fs.createReadStream(path))
        }
        case 'http':
        case 'https':
          return reply.redirect(`${protocol}://${path}`)
        default:
          throw fail(501, `protocol not supported: ${protocol}`)
      }
    })

    // Selections

    api.get('/selections/:id', show('selection'))
    api.get('/selections/:id/file.:format', extract('selection'))

  }, { prefix: '/project/:project' })

  app.get('/version', () => ({ version }))

  app.get('/', () => ({
    project: current(),
    status: 'ok',
    version
  }))

  return app
}

// Log requests at debug level only; errors keep the default levels.
class Logging extends LogController {
  incomingRequest () {}

  requestCompleted (error, request, reply, metadata) {
    if (error)
      return super.requestCompleted(error, request, reply, metadata)

    request.log.debug({
      ms: Math.round(reply.elapsedTime),
      status: reply.statusCode,
      method: request.method,
      query: request.query,
      url: request.url
    })
  }
}
