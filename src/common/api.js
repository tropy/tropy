'use strict'

const Koa = require('koa')
const Router = require('@koa/router')

const act = require('../actions/api')

const project = {
  async import(ctx) {
    let { assert, query, rsvp } = ctx

    assert.ok(query.file, 400, 'missing file parameter')

    let res = await rsvp('project', act.project.import({
      files: query.file,
      list: query.list
    }))

    ctx.body = res.payload
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
