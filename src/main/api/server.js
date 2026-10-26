import { logger, warn } from '../../common/log.js'
import dialog from '../dialog.js'

async function createServer (app, port) {
  let { create } = await import('./api.js')

  let api = create({
    loggerInstance: logger.child({ name: 'api' }),
    projects: app.projects,
    version: app.version,
    wm: app.wm
  })

  try {
    await api.listen({
      port,
      host: '127.0.0.1'
    })

    return api

  } catch (err) {
    await api.close()
    throw err
  }
}

export class Server {
  #api = null

  constructor (app) {
    this.app = app
  }

  get port () {
    return this.app.opts.port ?? this.app.state.port
  }

  get status () {
    return this.#api != null
  }

  async address () {
    return (await this.#api)?.server.address()
  }

  start () {
    if (this.app.state.api || this.app.opts.port != null) {
      this.#api ??= createServer(this.app, this.port).catch(err => {
        this.#api = null

        if (err.code !== 'EADDRINUSE')
          throw err

        warn({ err }, 'api.listen failed')
        dialog.alert(null, this.app.dict.dialog.addrinuse)
      })
    }

    return this.#api
  }

  stop () {
    try {
      return this.#api?.then(api => api?.close(), () => {})
    } finally {
      this.#api = null
    }
  }
}
