'use strict'

const Koa = require('koa')
const Router = require('@koa/router')

const create = ({ dispatch, log, version }) => {
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

  api
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
    url: ctx.url
  })
}

module.exports = {
  create
}
