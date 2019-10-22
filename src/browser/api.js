'use strict'

const { info, warn, logger } = require('../common/log')
const { counter } = require('../common/util')

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
    this.seq = counter()
    this.pending = {}
  }

  dispatch = (action) => {
    return new Promise((resolve, reject) => {
      let win = this.app.wm.current()
      action.meta.id = this.seq.next().value

      if (this.app.dispatch(action, win))
        this.pending[action.meta.id] = { resolve, reject }
      else
        reject()
    })
  }

  onResponse({ error, payload, meta }) {
    try {
      if (error)
        this.pending[meta.id].reject(payload)
      else
        this.pending[meta.id].resolve({ payload, meta })

    } catch (e) {
      warn({
        stack: e.stack
      }, `failed to resolve API req #${meta.id}: ${e.message}`)
    } finally {
      delete this.pending[meta.id]
    }
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
