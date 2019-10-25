'use strict'

const Koa = require('koa')
const Router = require('@koa/router')
const act = require('../actions/api')

const show = (type) =>
  async (ctx) => {
    let { params, rsvp } = ctx

    let { payload } = await rsvp('project', act[type].show({
      id: params[type]
    }))

    if (payload != null)
      ctx.body = payload
    else
      ctx.status = 404
  }

const project = {
  async import(ctx) {
    let { assert, query, rsvp } = ctx

    assert.ok(query.file, 400, 'missing file parameter')

    let { payload } = await rsvp('project', act.import({
      files: query.file,
      list: query.list
    }))

    ctx.body = payload
  },

  items: {
    async find(ctx) {
      let { query, rsvp } = ctx

      let { payload } = await rsvp('project', act.item.find({
        tags: query.tag
      }))

      ctx.body = payload
    },

    show: show('item')
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
        item: params.item
      }))

      if (payload != null)
        ctx.body = payload
      else
        ctx.status = 404
    },

    show: show('photo')
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
    .get('/project/import', project.import)

    .get('/project/items', project.items.find)
    .get('/project/items/:item', project.items.show)
    .get('/project/items/:item/photos', project.photos.find)

    .get('/project/notes/:note', project.notes.show)
    .get('/project/photos/:photo', project.photos.show)
    .get('/project/selections/:selection', project.photos.show)


    .get('/version', (ctx) => {
      ctx.body = { version }
    })

  app
    .use(logging)
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
