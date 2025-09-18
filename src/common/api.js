import fs from 'fs'
import { basename } from 'path'
import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import act from '../actions/api'

const show = (type) =>
  async (ctx) => {
    let { params, rsvp } = ctx

    let { payload } = await rsvp('project', act[type].show({
      id: params.id
    }))

    if (payload != null)
      ctx.body = payload
    else
      ctx.status = 404
  }

const extract = (type) =>
  async (ctx) => {
    let { assert, params, rsvp } = ctx

    assert(
      (/^(jpg|png|webp|raw)$/).test(params.format),
      400,
      'format unknown')

    let { payload } = await rsvp('project', act.photo.extract({
      [type]: params.id,
      format: params.format
    }))

    if (payload != null) {
      ctx.body = Buffer.from(payload.data)
      ctx.type = payload.format
    } else {
      ctx.status = 404
    }
  }

const project = {
  async import(ctx) {
    let { assert, request, rsvp } = ctx
    let { file, list, data } = request.body

    assert(
      request.type === 'application/x-www-form-urlencoded',
      400,
      'content-type not supported')

    if (data) {
      try {
        data = JSON.parse(data)
      } catch {
        ctx.throw(400, 'invalid JSON data parameter')
      }
    }

    assert.ok(file || data, 400, 'missing file/data parameter')

    let { payload } = await rsvp('project', act.import({
      data,
      files: file,
      list
    }))

    ctx.body = payload
  },

  items: {
    async find(ctx) {
      let { params, query, rsvp } = ctx
      let { sort = 'item.created', reverse = false } = query

      let { payload } = await rsvp('project', act.item.find({
        tags: query.tag,
        list: params.id,
        sort: { column: sort, asc: !reverse },
        query: query.q
      }))

      ctx.body = payload
    },

    show: show('item')
  },

  data: {
    async save(ctx) {
      let { assert, params, request, rsvp } = ctx

      assert(request.is('json'), 400, 'missing json data')

      let { payload } = await rsvp('project', act.metadata.save({
        id: params.id,
        data: request.body
      }))

      ctx.body = payload
    },

    show: show('metadata')
  },

  notes: {
    async create(ctx) {
      let { assert, request, rsvp } = ctx
      let { html, language, photo, selection } = request.body

      assert.ok(html, 400, 'missing html parameter')

      assert.ok(photo || selection, 400,
        'missing photo or selection parameter')

      let { payload } = await rsvp('project', act.note.create({
        language,
        photo: photo ? Number(photo) : null,
        selection: selection ? Number(selection) : null,
        html
      }))

      ctx.body = {
        id: Object.values(payload).map(note => note.id)
      }
    },

    async delete(ctx) {
      let { assert, params, rsvp } = ctx

      let id = Number(params.id)
      assert.ok(id > 0, 400, 'bad id')

      let { payload } = await rsvp('project', act.note.delete([
        id
      ]))

      if (payload.length > 0) {
        ctx.status = 200
      } else {
        ctx.status = 404
      }
    },

    async show(ctx) {
      let { assert, params, query, rsvp } = ctx

      if (query.format)
        assert(
          (/^(json|html|plain|text|md|markdown)$/).test(query.format),
          400,
          'format unknown')

      let { payload } = await rsvp('project', act.note.show({
        id: params.id,
        format: query.format
      }))

      if (payload != null) {
        if (query.format === 'html')
          ctx.type = 'text/html'
        if (query.format === 'text' || query.format === 'plain')
          ctx.type = 'text/plain'
        if (query.format === 'markdown' || query.format === 'md')
          ctx.type = 'text/markdown'

        ctx.body = payload

      } else {
        ctx.status = 404
      }
    }
  },

  transcriptions: {
    async create(ctx) {
      let { assert, request, rsvp } = ctx
      let { data, text, angle, mirror, photo, selection } = request.body

      assert.ok(data || text, 400,
        'missing data or text parameter')
      assert.ok(photo || selection, 400,
        'missing photo or selection parameter')

      let { payload } = await rsvp('project', act.transcriptions.create({
        data,
        text,
        angle,
        mirror,
        photo: photo ? Number(photo) : null,
        selection: selection ? Number(selection) : null
      }))

      ctx.body = {
        id: Object.values(payload).map(tr => tr.id)
      }
    },

    async find(ctx) {
      let { assert, params, query, rsvp } = ctx

      if (query.format)
        assert(
          (/^(json|html|plain|text)$/).test(query.format),
          400,
          'format unknown')

      if (query.separator)
        assert(
          (/^[*_=-]+$/).test(query.separator),
          400,
          'bad separator')

      let { payload } = await rsvp('project', act.transcription.find({
        id: params.id,
        format: query.format,
        separator: query.separator
      }))

      if (payload != null) {
        if (query.format === 'html')
          ctx.type = 'text/html'
        if (query.format === 'text' || query.format === 'plain')
          ctx.type = 'text/plain'

        ctx.body = payload

      } else {
        ctx.status = 404
      }
    },

    async show(ctx) {
      let { assert, params, query, rsvp } = ctx

      if (query.format)
        assert(
          (/^(json|html|plain|text|xml|alto)$/).test(query.format),
          400,
          'format unknown')

      let { payload } = await rsvp('project', act.transcription.show({
        id: params.id,
        format: query.format
      }))

      if (payload != null) {
        if (query.format === 'html')
          ctx.type = 'text/html'
        if (query.format === 'text' || query.format === 'plain')
          ctx.type = 'text/plain'
        if (query.format === 'alto' || query.format === 'xml')
          ctx.type = 'application/xml'

        ctx.body = payload

      } else {
        ctx.status = 404
      }
    }
  },

  photos: {
    async find(ctx) {
      let { params, rsvp } = ctx

      let { payload } = await rsvp('project', act.photo.find({
        item: params.id
      }))

      if (payload != null)
        ctx.body = payload
      else
        ctx.status = 404
    },

    async raw(ctx) {
      let { params, rsvp } = ctx

      let { payload } = await rsvp('project', act.photo.show({
        id: params.id
      }))

      if (payload == null) {
        ctx.status = 404
      } else {
        let { protocol, path, mimetype } = payload

        switch (protocol) {
          case 'file': {
            let stats = await fs.promises.stat(path)

            if (stats && stats.isFile()) {
              ctx.length = stats.size
              ctx.lastModified = new Date(stats.mtimeMs)
              ctx.type = mimetype
              ctx.attachment(basename(path))
              ctx.body = fs.createReadStream(path)
            } else {
              ctx.status = 404
            }

            break
          }
          case 'http':
          case 'https':
            ctx.redirect(`${protocol}://${path}`)
            break
          default:
            ctx.status = 501
        }
      }
    },

    extract: extract('photo'),
    show: show('photo')
  },

  tags: {
    async create(ctx) {
      let { assert, request, rsvp } = ctx

      assert.ok(request.body.name, 400, 'missing name parameter')

      let { payload } = await rsvp('project', act.tag.create({
        name: request.body.name,
        color: request.body.color,
        items: request.body.item
      }))

      ctx.body = payload
    },

    async delete(ctx) {
      let { assert, request, rsvp } = ctx

      assert.ok(request.body.tag, 400, 'missing tag parameter')

      let { payload } = await rsvp('project', act.tag.delete(request.body.tag))

      ctx.body = payload
    },

    async add(ctx) {
      let { assert, params, request, rsvp } = ctx

      assert.ok(request.body.tag, 400, 'missing tag parameter')

      let { payload } = await rsvp('project', act.tag.add({
        id: params.id,
        tags: request.body.tag
      }))

      ctx.body = payload
    },

    async remove(ctx) {
      let { params, request, rsvp } = ctx

      let { payload } = await rsvp('project',
        request.body.tag ?
            act.tag.remove({ id: params.id, tags: request.body.tag }) :
            act.tag.clear({ id: params.id }))

      ctx.body = payload
    },

    async find(ctx) {
      let { params, query, rsvp } = ctx

      let { payload } = await rsvp('project', act.tag.find({
        id: params.id,
        reverse: query.reverse
      }))

      if (payload != null)
        ctx.body = payload
      else
        ctx.status = 404
    },

    show: show('tag')
  },

  lists: {
    async show(ctx) {
      let { params, query, rsvp } = ctx

      let { payload } = await rsvp('project', act.list.show({
        id: params.id ?? 0,
        expand: query.expand != null && query.expand !== 'false'
      }))

      if (payload != null)
        ctx.body = payload
      else
        ctx.status = 404
    },
  },

  selections: {
    extract: extract('selection'),
    show: show('selection')
  }
}

export function create({ dispatch, log, rsvp, version }) {
  let app = new Koa
  let api = new Router

  app.silent = true
  app.on('error', e => {
    log.error({
      stack: e.stack,
      status: e.status
    }, e.message)
  })

  app.context.dispatch = dispatch
  app.context.log = log
  app.context.rsvp = rsvp

  api
    .post('/project/import', project.import)

    .get('/project/items', project.items.find)
    .get('/project/items/:id', project.items.show)
    .get('/project/items/:id/photos', project.photos.find)
    .get('/project/items/:id/tags', project.tags.find)
    .get('/project/items/:id/transcriptions', project.transcriptions.find)
    .post('/project/items/:id/tags', project.tags.add)
    .delete('/project/items/:id/tags', project.tags.remove)

    .get('/project/lists/:id/items', project.items.find)
    .get('/project/lists{/:id}', project.lists.show)

    .post('/project/tags', project.tags.create)
    .delete('/project/tags', project.tags.delete)
    .get('/project/tags', project.tags.find)
    .get('/project/tags/:id', project.tags.show)

    .post('/project/data/:id', project.data.save)
    .get('/project/data/:id', project.data.show)

    .get('/project/notes/:id', project.notes.show)
    .post('/project/notes', project.notes.create)
    .delete('/project/notes/:id', project.notes.delete)

    .get('/project/transcriptions/:id', project.transcriptions.show)
    .post('/project/transcriptions', project.transcriptions.create)

    .get('/project/photos/:id', project.photos.show)
    .get('/project/photos/:id/raw', project.photos.raw)
    .get('/project/photos/:id/file.:format', project.photos.extract)

    .get('/project/selections/:id', project.selections.show)
    .get('/project/selections/:id/file.:format', project.selections.extract)

    .get('/version', (ctx) => {
      ctx.body = { version }
    })

  app
    .use(logging)
    .use(bodyParser())
    .use(api.routes())
    .use(api.allowedMethods())

  return app
}

const logging = async (ctx, next) => {
  const START = Date.now()
  await next()

  ctx.log.debug({
    ms: Date.now() - START,
    status: ctx.status,
    method: ctx.method,
    query: ctx.query,
    url: ctx.url
  })
}
