'use strict'

const Koa = require('koa')

class Server {

  constructor(app) {
    this.app = app
    this.koa = new Koa

    this.koa.use(async ctx => {
      ctx.body = this.app.version
    })
  }

  start() {
    this.koa.listen(this.app.opts.port)
  }
}

module.exports = Server
