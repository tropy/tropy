import { debug, logger, warn } from '../../common/log.js'
import { HttpError } from '../../common/error.js'
import { urlId } from '../../common/util.js'
import dialog from '../dialog.js'

export class Server {
  #api
  #pending

  constructor (app) {
    this.app = app
  }

  current = () => {
    return this.app.state.recent[0]
  }

  rsvp = (win, action, options) => (
    this.app.wm.rsvp(win, action, options)
  )

  resolveProject = (id) => {
    if (id === 'current') {
      let win = this.app.wm.current('project')
      if (win == null)
        throw new HttpError({ status: 404, body: 'no project is open' })

      let path = this.app.getProject(win)?.path
      if (path == null)
        throw new HttpError({ status: 404, body: 'no project is open' })

      return { win, path, id: urlId(path) }
    }

    // The router decodes the id, but URL ids are encoded.
    id = encodeURIComponent(id.toWellFormed().normalize())

    // Several projects can share a URL id when their files have the same
    // basename; resolve to the most recent.
    let matches = this.app.state.recent.filter(f => urlId(f) === id)

    if (matches.length === 0)
      throw new HttpError({ status: 404, body: `unknown project: ${id}` })

    let [path] = matches

    if (matches.length > 1)
      debug(`api: ambiguous project URL id ${id}, using the most recent`)

    let win = this.app.wm.values('project')
      .find(w => this.app.getProject(w)?.path === path)

    if (win == null)
      throw new HttpError({ status: 404, body: `project "${id}" is not open` })

    return { win, path, id }
  }

  get port () {
    return this.app.opts.port || this.app.state.port
  }

  get status () {
    return this.#api != null
  }

  async start () {
    if (this.#api || !(this.app.state.api || this.app.opts.port))
      return

    this.#pending ??= this.listen().finally(() => {
      this.#pending = null
    })

    await this.#pending
  }

  // Closed Fastify instances cannot listen again,
  // so every start creates a new one.
  async listen () {
    let { create } = await import('./api.js')

    let api = create({
      current: this.current,
      log: logger.child({ name: 'api' }),
      resolveProject: this.resolveProject,
      rsvp: this.rsvp,
      version: this.app.version
    })

    try {
      await api.listen({ port: this.port, host: '127.0.0.1' })
      this.#api = api
    } catch (err) {
      await api.close()

      if (err.code !== 'EADDRINUSE')
        throw err

      warn({ err }, 'api.listen failed')
      dialog.alert(null, this.app.dict.dialog.addrinuse)
    }
  }

  async stop () {
    await this.#api?.close()
    this.#api = null
  }
}
