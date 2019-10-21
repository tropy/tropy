'use strict'

const Koa = require('koa')

const api = {
  create({ dispatch, log, version }) {
    let app = new Koa

    app.silent = true
    app.on('error', e => {
      log.error({
        stack: e.stack,
        status: e.status
      }, e.message)
    })

    app.context.dispatch = dispatch
    app.context.log = log
    app.context.version = version

    app
      .use(api.logging)
      .use(api.version)

    return app
  },


  async logging(ctx, next) {
    const START = Date.now()
    await next()

    ctx.log.debug({
      ms: Date.now() - START,
      status: ctx.status,
      url: ctx.url
    })
  },

  async version(ctx) {
    ctx.body = ctx.version
  }
}

module.exports = api
