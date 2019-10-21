'use strict'

const Koa = require('koa')

const api = {
  create({ dispatch, log, version }) {
    let app = new Koa

    app.silent = true
    app.on('error', e => {
      log.error({ stack: e.stack }, e.message)
    })

    app.context.dispatch = dispatch
    app.context.log = log
    app.context.version = version

    app
      .use(api.version)

    return app
  },


  async version(ctx) {
    ctx.body = ctx.version
  }
}

module.exports = api
