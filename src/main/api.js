import { debug, info, logger } from '../common/log.js'

export class Server {
  #server

  constructor(app) {
    this.app = app
  }

  dispatch = (type, action) => {
    this.app.wm.current(type).webContents.send('dispatch', action)
  }

  rsvp = (type, action) => (
    this.app.wm.rsvp(type, action)
  )

  async start() {
    if (this.#server != null)
      throw new Error('api already started')

    if (this.app.state.api || this.app.opts.port) {
      if (this.koa == null) {
        let api = await import('../common/api')

        this.koa = api.create({
          dispatch: this.dispatch,
          log: logger.child({ name: 'api' }),
          rsvp: this.rsvp,
          version: this.app.version
        })
      }

      let port = this.app.opts.port || this.app.state.port

      info(`api.start listening on port ${port}...`)
      this.#server = this.koa.listen(port)
    }
  }

  stop() {
    return new Promise((resolve) => {
      if (this.#server != null) {
        info('api.stop closing connections...')
        this.#server.close(() => {
          this.#server = null
          debug('api.stop all connections closed')
          resolve()
        })
        this.#server.closeAllConnections()
      } else {
        resolve()
      }
    })
  }
}
