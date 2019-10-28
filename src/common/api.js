'use strict'

const Koa = require('koa')
const Router = require('@koa/router')
const bodyParser = require('koa-bodyparser')
const act = require('../actions/api')

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

const project = {
  async import(ctx) {
    let { assert, request, rsvp } = ctx

    assert.ok(request.body.file, 400, 'missing file parameter')

    let { payload } = await rsvp('project', act.import({
      files: request.body.file,
      list: request.body.list
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
    async show(ctx) {
      let { assert, params, query, rsvp } = ctx

      if (query.format)
        assert(
          (/^(json|html|plain|text|md|markdown)$/).test(query.format),
          400,
          'format unknown')

      let { payload } = await rsvp('project', act.note.show({
        id: params.note,
        format: query.format
      }))

      if (payload != null) {
        if (query.format === 'html')
          ctx.type = 'text/html'
        if (query.format === 'markdown' || query.format === 'md')
          ctx.type = 'text/markdown'

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

    show: show('photo')
  },

  tags: {
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

  selections: {
    show: show('selection')
  }
}

const create = ({ dispatch, log, rsvp, version }) => {
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
    .post('/project/items/:id/tags', project.tags.add)
    .delete('/project/items/:id/tags', project.tags.remove)

    .get('/project/list/:id/items', project.items.find)

    .get('/project/tags', project.tags.find)
    .get('/project/tags/:id', project.tags.show)

    .post('/project/data/:id', project.data.save)
    .get('/project/data/:id', project.data.show)

    .get('/project/notes/:id', project.notes.show)

    .get('/project/photos/:id', project.photos.show)

    .get('/project/selections/:id', project.photos.show)

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

module.exports = {
  create
}
