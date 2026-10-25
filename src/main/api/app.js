import fs from 'node:fs'
import { basename } from 'node:path'
import Fastify, { LogController } from 'fastify'
import formbody from '@fastify/formbody'
import act from '../../actions/api.js'
import { MIME } from '../../constants/index.js'
import { HttpError } from '../../common/error.js'
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

const TYPES = {
  html: 'text/html',
  plain: 'text/plain',
  text: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  alto: 'application/xml',
  xml: 'application/xml'
}

const id = { type: 'integer', minimum: 1 }
const ids = { type: 'array', items: id }

// List id 0 is the root list.
const list = { type: 'integer', minimum: 0 }
const strings = { type: 'array', items: { type: 'string' } }

const object = (properties, required) => ({
  type: 'object',
  properties,
  ...(required && { required })
})

const params = object({ id })

const format = (...formats) => ({
  format: { enum: formats }
})

// Responds with the payload in the requested format.
const formatted = (reply, format, payload) => {
  found(payload)

  if (format in TYPES)
    reply.type(TYPES[format])

  return payload
}

const show = (type) => ({
  schema: { params },
  async handler ({ params, rsvp }) {
    return found(await rsvp(act[type].show({ id: params.id })))
  }
})

const extract = (type) => ({
  schema: {
    params: object({ id, ...format('jpg', 'png', 'webp', 'raw') })
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

// Shared by /tags and /items/:id/tags
const findTags = {
  schema: {
    params,
    querystring: object({ reverse: { type: 'boolean' } })
  },
  async handler ({ params, query, rsvp }) {
    return found(await rsvp(act.tag.find({
      id: params.id,
      reverse: query.reverse
    })))
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

  app.register(formbody)
  app.register(guard)
  app.register(legacy)

  app.register(async (api) => {
    await api.register(project, { resolveProject, rsvp })

    // Validate requests without a body as an empty body,
    // e.g. DELETE /items/:id/tags clears all tags.
    api.addHook('preValidation', async (request) => {
      request.body ??= {}
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
        body: object({
          file: strings,
          list: id,
          data: {},
          createLists: { type: 'boolean' },
          tagColor: { type: 'string' }
        })
      }
    }, async ({ body, rsvp }) => {
      let { file, list, data, createLists, tagColor } = body

      // Form bodies pass data as a JSON string.
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch {
          throw fail(400, 'invalid JSON data parameter')
        }
      }

      if (!file && !data)
        throw fail(400, 'missing file/data parameter')

      // Imports can take a long time: wait without a timeout.
      return rsvp(act.import({
        data,
        files: file,
        list
      }, {
        createLists,
        tagColor
      }), { timeout: 0 })
    })

    // Items

    api.get('/items', findItems)
    api.get('/items/:id', show('item'))

    api.get('/items/:id/photos', { schema: { params } }, async ({ params, rsvp }) =>
      found(await rsvp(act.photo.find({ item: params.id }))))

    api.get('/items/:id/tags', findTags)

    api.post('/items/:id/tags', {
      schema: {
        params,
        body: object({ tag: strings }, ['tag'])
      }
    }, async ({ body, params, rsvp }) =>
      rsvp(act.tag.add({ id: params.id, tags: body.tag })))

    api.delete('/items/:id/tags', {
      schema: {
        params,
        body: object({ tag: strings })
      }
    }, async ({ body, params, rsvp }) =>
      rsvp(body?.tag ?
        act.tag.remove({ id: params.id, tags: body.tag }) :
        act.tag.clear({ id: params.id })))

    api.get('/items/:id/transcriptions', {
      schema: {
        params,
        querystring: object({
          ...format('json', 'html', 'plain', 'text'),
          separator: { type: 'string', pattern: '^[*_=-]+$' }
        })
      }
    }, async ({ params, query, rsvp }, reply) =>
      formatted(reply, query.format, await rsvp(act.transcription.find({
        id: params.id,
        format: query.format,
        separator: query.separator
      }))))

    // Lists

    api.get('/lists/:id?', {
      schema: {
        params: object({ id: list }),
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
    }, async ({ body, rsvp }) =>
      rsvp(act.list.create({ name: body.name, parent: body.parent })))

    api.get('/lists/:id/items', findItems)

    api.post('/lists/:id/items', {
      schema: {
        params,
        body: object({ item: ids }, ['item'])
      }
    }, async ({ body, params, rsvp }) =>
      rsvp(act.list.items.add({ id: params.id, items: body.item })))

    // Tags

    api.get('/tags', findTags)

    // Tags can be looked up by id or name.
    api.get('/tags/:id', async ({ params, rsvp }) =>
      found(await rsvp(act.tag.show({ id: params.id }))))

    api.post('/tags', {
      schema: {
        body: object({
          name: { type: 'string', minLength: 1 },
          color: { type: 'string' },
          item: ids
        }, ['name'])
      }
    }, async ({ body, rsvp }) =>
      rsvp(act.tag.create({
        name: body.name,
        color: body.color,
        items: body.item
      })))

    api.delete('/tags', {
      schema: {
        body: object({ tag: strings }, ['tag'])
      }
    }, async ({ body, rsvp }) =>
      rsvp(act.tag.delete(body.tag)))

    // Metadata

    api.get('/data/:id', show('metadata'))

    api.post('/data/:id', {
      schema: {
        params,
        body: { type: 'object', minProperties: 1 }
      }
    }, async ({ body, params, rsvp }) =>
      rsvp(act.metadata.save({ id: params.id, data: body })))

    // Notes

    api.get('/notes/:id', {
      schema: {
        params,
        querystring: object(
          format('json', 'html', 'plain', 'text', 'md', 'markdown'))
      }
    }, async ({ params, query, rsvp }, reply) =>
      formatted(reply, query.format, await rsvp(act.note.show({
        id: params.id,
        format: query.format
      }))))

    api.post('/notes', {
      schema: {
        body: object({
          html: { type: 'string', minLength: 1 },
          language: { type: 'string' },
          photo: id,
          selection: id
        }, ['html'])
      }
    }, async ({ body, rsvp }) => {
      let { html, language, photo = null, selection = null } = body

      if (photo == null && selection == null)
        throw fail(400, 'missing photo or selection parameter')

      let payload = await rsvp(act.note.create({
        language,
        photo,
        selection,
        html
      }))

      return {
        id: Object.values(payload).map(note => note.id)
      }
    })

    api.delete('/notes/:id', { schema: { params } }, async ({ params, rsvp }) => {
      let payload = await rsvp(act.note.delete([params.id]))

      if (payload.length === 0)
        throw fail(404, 'not found')

      return {}
    })

    // Transcriptions

    api.get('/transcriptions/:id', {
      schema: {
        params,
        querystring: object(
          format('json', 'html', 'plain', 'text', 'xml', 'alto'))
      }
    }, async ({ params, query, rsvp }, reply) =>
      formatted(reply, query.format, await rsvp(act.transcription.show({
        id: params.id,
        format: query.format
      }))))

    api.post('/transcriptions', {
      schema: {
        body: object({
          data: {},
          text: { type: 'string' },
          angle: { type: 'number' },
          mirror: { type: 'boolean' },
          photo: id,
          selection: id
        })
      }
    }, async ({ body, rsvp }) => {
      let { data, text, angle, mirror, photo = null, selection = null } = body

      if (!data && !text)
        throw fail(400, 'missing data or text parameter')
      if (photo == null && selection == null)
        throw fail(400, 'missing photo or selection parameter')

      let payload = await rsvp(act.transcription.create({
        data,
        text,
        angle,
        mirror,
        photo,
        selection
      }))

      return {
        id: Object.values(payload).map(tr => tr.id)
      }
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
