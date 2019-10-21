'use strict'

class Server {
  constructor(app) {
    if (app.opts.port) {
      let api = require('../common/api')
      let { logger } = require('../common/log')

      this.koa = api.create({
        dispatch: this.dispatch,
        log: logger.child({ name: 'api' }),
        version: app.version
      })
    }

    this.app = app
  }

  dispatch = async () => {
  }

  start() {
    if (this.koa) {
      this.koa.listen(this.app.opts.port)
    }
  }

  stop() {
  }
}

module.exports = {
  Server
}
