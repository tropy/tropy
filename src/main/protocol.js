import { clipboard } from 'electron'
import { HttpError } from '../common/error.js'
import { info, warn } from '../common/log.js'
import { protocolURL } from '../common/util.js'
import * as act from './actions.js'
import { id, object, urlId } from './api/schema.js'

const fail = (status, body) =>
  new HttpError({ status, body })

// Route for tropy://project{pathname} URLs:
//
// Opens the project and dispatches the action
// returned by handler (if any) to its window.
//
// Resolves with the project, or null if none was opened.
function projectRoute (pathname, { description, params, query }, handler) {
  return {
    pattern: new URLPattern({ hostname: 'project', pathname }),
    description,
    params,
    query,
    async handler (app, args, opts) {
      let opened = await openProject(app, args.urlId, opts)

      if (opened == null)
        return null

      if (handler)
        app.dispatch(handler(args), opened.win)

      return opened.project
    }
  }
}

// Route for tropy://{hostname} URLs:
// Shows an app window.
// Resolves with null.
function windowRoute (hostname, { description }, handler) {
  return {
    pattern: new URLPattern({ hostname, pathname: '' }),
    description,
    params: object({}),
    async handler (app) {
      await handler(app)
      return null
    }
  }
}

const ROUTES = Object.freeze([
  projectRoute('{/:urlId}?', {
    description: 'Open a project; without URL id, the current or most recent one',
    params: object({ urlId: { ...urlId, default: 'current' } })
  }),

  projectRoute('/:urlId/items', {
    description: 'Show all items, or search them (q)',
    params: object({ urlId }, ['urlId']),
    query: object({ q: { type: 'string', description: 'Search query' } })
  }, ({ q = '' }) =>
    act.nav.select({ query: q })),

  projectRoute('/:urlId/items/:item{/:photo}?{/:selection}?', {
    description: 'Show an item, photo or selection (not verified)',
    params: object({ urlId, item: id, photo: id, selection: id },
      ['urlId', 'item'])
  }, ({ item, photo, selection }) =>
    act.item.open({ id: item, photo, selection })),

  projectRoute('/:urlId/lists/:list', {
    description: 'Show a list (not verified)',
    params: object({ urlId, list: id }, ['urlId', 'list'])
  }, ({ list }) =>
    act.nav.select({ list, query: '' })),

  projectRoute('/:urlId/tags/:tag', {
    description: 'Show the items with a tag (not verified)',
    params: object({ urlId, tag: id }, ['urlId', 'tag'])
  }, ({ tag }) =>
    act.nav.select({ tags: [tag], query: '' })),

  projectRoute('/:urlId/trash', {
    description: 'Show the trash',
    params: object({ urlId }, ['urlId'])
  }, () =>
    act.nav.select({ trash: true, query: '' })),

  windowRoute('(prefs|preferences)', {
    description: 'Show the preferences'
  }, (app) =>
    app.showPreferencesWindow()),

  windowRoute('(about|version)', {
    description: 'Show the about window'
  }, (app) =>
    app.showAboutWindow())
])

export class ProtocolHandler {
  constructor (app) {
    this.app = app
  }

  // The tropy:// url route table, e.g. for documentation.
  get routes () {
    return ROUTES
  }

  start () {
    this.app
      .on('app:copy-url', this.handleCopyURL)
      .on('app:copy-project-url', this.handleCopyProjectURL)
      .on('app:copy-item-link', this.handleCopyItemLink)
      .on('app:copy-photo-link', this.handleCopyPhotoLink)
  }

  stop () {
    this.app
      .off('app:copy-url', this.handleCopyURL)
      .off('app:copy-project-url', this.handleCopyProjectURL)
      .off('app:copy-item-link', this.handleCopyItemLink)
      .off('app:copy-photo-link', this.handleCopyPhotoLink)
  }

  // Resolves with the result of the url's route.
  // With prompt, unknown projects can be picked in a file dialog.
  async handle (url, { prompt = false } = {}) {
    try {
      url = new URL(url)
    } catch {
      throw fail(400, `invalid url: ${url}`)
    }

    if (url.protocol !== 'tropy:')
      throw fail(400, `not a tropy url: ${url}`)

    let input = {
      hostname: url.hostname.toLowerCase(),
      pathname: url.pathname
    }

    for (let route of ROUTES) {
      let match = route.pattern.exec(input)

      if (match) {
        let params = decode(match.pathname.groups)
        let query = Object.fromEntries(url.searchParams)

        await validate(route.params, params)
        await validate(route.query ?? object({}), query)

        try {
          return await route.handler(this.app, { ...query, ...params }, { prompt })
        } catch (err) {
          throw (err.status) ? err : new HttpError({
            status: 500,
            body: err.message
          }, { cause: err })
        }
      }
    }

    throw fail(404, `unknown tropy url: ${url}`)
  }

  copy (project, { item, photo, selection } = {}) {
    if (!project) return

    clipboard
      .writeText(protocolURL(project.path, { item, photo, selection }))
      .catch(err => warn({ err }, 'failed to copy protocol url'))
  }

  async handleRequest (url) {
    info(`opening url ${url}`)

    try {
      return await this.handle(url, { prompt: true })
    } catch (err) {
      warn({ err }, `failed to open ${url}: ${err.message}`)
    }
  }

  handleCopyURL = (_, { target }) => {
    this.copy(target)
  }

  handleCopyProjectURL = (win) => {
    this.copy(this.app.projects.get(win))
  }

  handleCopyItemLink = (win, { target }) => {
    this.copy(this.app.projects.get(win), {
      item: target.id,
      photo: target.photos[0]
    })
  }

  handleCopyPhotoLink = (win, { target }) => {
    this.copy(this.app.projects.get(win), {
      item: target.item,
      photo: target.id,
      selection: target.selection
    })
  }
}

async function openProject (app, urlId, { prompt }) {
  let win = await app.projects.openById(urlId)

  if (win == null) {
    if (!prompt)
      throw fail(404, `unknown project: ${urlId}`)

    if (urlId === 'current') {
      await app.projects.show()
      return null
    }

    let file = await app.projects.pick(app.wm.current())

    if (!file)
      return null

    win = await app.projects.open(file)
  }

  let path = app.projects.get(win)?.path

  if (path == null)
    throw fail(409, `project closed while opening: ${urlId}`)

  return { win, project: app.projects.describe(path) }
}

function decode (groups) {
  let params = {}

  for (let [name, value] of Object.entries(groups)) {
    if (value == null)
      continue

    try {
      params[name] = decodeURIComponent(value)
    } catch {
      throw fail(400, `malformed tropy url segment: ${value}`)
    }
  }

  return params
}

let ajv

async function validate (schema, params) {
  if (schema == null)
    return

  if (ajv == null) {
    let { default: Ajv } = await import('ajv')
    ajv = new Ajv({ allErrors: true, coerceTypes: true, useDefaults: true })
  }

  let fn = ajv.compile(schema)

  if (!fn(params))
    throw fail(400, ajv.errorsText(fn.errors, { dataVar: 'params' }))
}
