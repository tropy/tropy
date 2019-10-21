'use strict'

const { info, logger } = require('../common/log')

class Server {
  constructor(app) {
    if (app.opts.port) {
      let api = require('../common/api')

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
      let { port } = this.app.opts
      info(`starting api on port ${port}`)
      this.koa.listen(port)
    }
  }

  stop() {
  }
}

module.exports = {
  Server
}
