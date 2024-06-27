import { info, logger } from '../common/log'

export class Server {
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
    if (this.app.state.api || this.app.opts.port) {
      let api = await import('../common/api')

      this.koa = api.create({
        dispatch: this.dispatch,
        log: logger.child({ name: 'api' }),
        rsvp: this.rsvp,
        version: this.app.version
      })

      let port = this.app.opts.port || this.app.state.port

      info(`api.start on port ${port}`)
      this.koa.listen(port)
    }
  }

  stop() {
  }
}
