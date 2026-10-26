import { HttpError } from '../../common/error.js'
import * as act from '../actions.js'
import { id, object } from './schema.js'

const urlId = {
  type: 'string',
  minLength: 1,
  description: 'URL id: the project file name, without extension'
}

const fail = (status, body) =>
  new HttpError({ status, body })

export const routes = [{
  pattern: new URLPattern({
    hostname: 'project',
    pathname: '{/:urlId}?'
  }),
  description: 'Open a project. Without URL id, show the current ' +
    'project or open the most recent one.',
  params: object({ urlId: { ...urlId, default: 'current' } }),
  handler: async (app, params, opts) =>
    (await openProject(app, params.urlId, opts))?.project ?? null
}, {
  pattern: new URLPattern({
    hostname: 'project',
    pathname: '/:urlId/items/:item/:photo{/:selection}?'
  }),
  description: 'Open a project and show an item photo or selection. ' +
    'Resolves with the project; the item is not verified.',
  params: object({ urlId, item: id, photo: id, selection: id },
    ['urlId', 'item', 'photo']),
  handler: openItem
}, {
  pattern: new URLPattern({ hostname: '(prefs|preferences)' }),
  description: 'Show the preferences',
  async handler (app) {
    await app.showPreferencesWindow()
    return null
  }
}, {
  pattern: new URLPattern({ hostname: '(about|version)' }),
  description: 'Show the about window',
  async handler (app) {
    await app.showAboutWindow()
    return null
  }
}]

export async function handle (app, url, { prompt = false } = {}) {
  try {
    url = new URL(url)
  } catch {
    throw fail(400, `invalid url: ${url}`)
  }

  if (url.protocol !== 'tropy:')
    throw fail(400, `not a tropy url: ${url}`)

  for (let route of routes) {
    let match = route.pattern.exec(url.href)

    if (match) {
      let params = decode(match.pathname.groups)
      await validate(route.params, params)
      return route.handler(app, params, { prompt })
    }
  }

  throw fail(404, `unknown tropy url: ${url}`)
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

  win.show()

  return { win, project: app.projects.describe(path) }
}

async function openItem (app, { urlId, item, photo, selection }, opts) {
  let opened = await openProject(app, urlId, opts)

  if (opened == null)
    return null

  app.dispatch(act.item.open({ id: item, photo, selection }), opened.win)

  return opened.project
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
