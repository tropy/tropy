import { createServer } from 'node:http'
import { debug, info, logger, warn } from '../common/log.js'
import dialog from './dialog.js'

export class Server {
  #api
  #pending
  #server

  constructor(app) {
    this.app = app
  }

  current = () => {
    return this.app.state.recent[0]
  }

  dispatch = (type, action) => {
    this.app.wm.current(type).webContents.send('dispatch', action)
  }

  rsvp = (type, action) => (
    this.app.wm.rsvp(type, action)
  )

  get port() {
    return this.app.opts.port || this.app.state.port
  }

  get status() {
    return this.#server != null
  }

  async start() {
    if (this.app.state.api || this.app.opts.port) {
      if (this.#server == null) {
        try {
          if (!this.#pending) {
            this.#pending = this.createServer()
          }
          await this.#pending
        } finally {
          this.#pending = null
        }
      }
    }
  }

  async createServer() {
    if (this.#server != null)
      throw new Error('api already started')

    if (this.#api == null) {
      let { create } = await import('../common/api.js')

      this.#api = create({
        current: this.current,
        dispatch: this.dispatch,
        log: logger.child({ name: 'api' }),
        rsvp: this.rsvp,
        version: this.app.version
      })
    }

    try {
      this.#server = await this.listen()
    } catch (err) {
      if (err.code !== 'EADDRINUSE') {
        throw err
      }
      dialog.alert(null, this.app.dict.dialog.addrinuse)
    }
  }

  listen(port = this.port, callback = this.#api.callback()) {
    return new Promise((resolve, reject) => {
      debug('api.listen creating http server ...')
      let server = createServer(callback)

      function onError(err) {
        warn({ stack: err.stack }, `api.listen failed: ${err.message}`)
        reject(err)
        server.off('error', onError)
        server.off('listening', onListening)
        clearTimeout(timeout)
      }

      function onListening() {
        info(`api.listen on port ${port}...`)
        resolve(server)
        server.off('error', onError)
        server.off('listening', onListening)
        clearTimeout(timeout)
      }

      let timeout = setTimeout(() => {
        warn('api.listen timed out ...')
        reject(new Error('server.listen timeout'))
        server.off('error', onError)
        server.off('listening', onListening)
        server.close()
        server.closeAllConnections()
      }, 500)

      server.on('error', onError)
      server.on('listening', onListening)
      server.listen(port)
    })
  }

  async stop() {
    if (this.#server != null) {
      await this.close()
      this.#server = null
      debug('api.stop all connections closed')
    }
  }

  close(server = this.#server) {
    return new Promise((resolve) => {
      info('api.stop closing connections...')
      server.close(resolve)
      server.closeAllConnections()
    })
  }

}
