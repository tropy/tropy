import { createServer } from 'node:http'
import { debug, info, logger, warn } from '../common/log.js'
import { urlId } from '../common/url.js'
import dialog from './dialog.js'

// An error whose status/message Koa exposes in the response.
function httpError (status, message) {
  return Object.assign(new Error(message), { status, expose: status < 500 })
}

export class Server {
  #api
  #pending
  #server

  constructor (app) {
    this.app = app
  }

  current = () => {
    return this.app.state.recent[0]
  }

  dispatch = (type, action) => {
    this.app.wm.current(type).webContents.send('dispatch', action)
  }

  rsvp = (win, action) => (
    this.app.wm.rsvp(win, action)
  )

  resolveProject = (id) => {
    if (id === 'current') {
      let win = this.app.wm.current('project')
      if (win == null)
        throw httpError(404, 'no project is open')

      let path = this.app.getProject(win)?.path
      return { win, path, id: urlId(path) }
    }

    // Several projects can share a URL id when their files have the same
    // basename; resolve to the most recent.
    let matches = this.app.state.recent.filter(
      path => this.app.projectURLId(path) === id)

    if (matches.length === 0)
      throw httpError(404, `unknown project: ${id}`)

    let [path] = matches

    let win = this.app.wm.find('project',
      w => this.app.getProject(w)?.path === path)

    if (win == null)
      throw httpError(404, `project "${id}" is not open`)

    return {
      win,
      path,
      id,
      ambiguous: matches.length > 1
    }
  }

  get port () {
    return this.app.opts.port || this.app.state.port
  }

  get status () {
    return this.#server != null
  }

  async start () {
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

  async createServer () {
    if (this.#server != null)
      throw new Error('api already started')

    if (this.#api == null) {
      let { create } = await import('../common/api.js')

      this.#api = create({
        current: this.current,
        dispatch: this.dispatch,
        log: logger.child({ name: 'api' }),
        resolveProject: this.resolveProject,
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

  listen (port = this.port, callback = this.#api.callback()) {
    return new Promise((resolve, reject) => {
      debug('api.listen creating http server ...')
      let server = createServer(callback)

      function onError (err) {
        warn({ err }, 'api.listen failed')
        reject(err)
        server.off('error', onError)
        server.off('listening', onListening)
        clearTimeout(timeout)
      }

      function onListening () {
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

  async stop () {
    if (this.#server != null) {
      await this.close()
      this.#server = null
      debug('api.stop all connections closed')
    }
  }

  close (server = this.#server) {
    return new Promise((resolve) => {
      info('api.stop closing connections...')
      server.close(resolve)
      server.closeAllConnections()
    })
  }

}
