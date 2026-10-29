import { mock } from 'node:test'
import { basename } from 'node:path'
import { logger } from '#tropy/common/log.js'
import { protocolURL, urlId } from '#tropy/common/util.js'
import { create } from '#tropy/main/api/api.js'

// Sets up an API instance whose project windows are fakes:
// it records dispatched actions in api.actions and responds
// with api.respond(payload) or api.respond(action => payload).
//
// Any project id resolves to /projects/:id.tropy,
// except 'missing' (unknown project).
// All projects are open, except 'closed'.
//
// Requests send bodies as JSON, like curl --json.
// MCP requests use api.rpc(method, params) and resolve with the result;
// tropy:// URLs opened via MCP are recorded in api.proto.handle.
export function mkapi () {
  let response

  let windows = {}

  let api = {
    app: null,
    actions: [],

    // The fake window of the project with id.
    window (id) {
      windows[id] ??= { id }
      return windows[id]
    },

    get action () {
      return api.actions.at(-1)
    },

    respond (value) {
      response = value
    },

    proto: {
      routes: [{ url: 'tropy://project[/{urlId}]', summary: 'Open a project' }],
      handle: mock.fn(async (url) => ({ url }))
    },

    rsvp: mock.fn(async (win, action) => {
      api.actions.push(action)
      return {
        payload: (typeof response === 'function') ?
          await response(action) :
          response
      }
    }),

    request (method, url, body) {
      return api.app.inject({ method, url, payload: body })
    },

    async rpc (method, params) {
      let res = await api.app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          accept: 'application/json, text/event-stream',
          'user-agent': 'tropy-spark/1.0'
        },
        payload: { jsonrpc: '2.0', id: 1, method, params }
      })

      // Responses are sent as server-sent events.
      let data = res.body.match(/^data: (.*)$/m)?.[1] ?? res.body
      return JSON.parse(data).result
    },

    get: (url) => api.request('GET', url),
    post: (url, body) => api.request('POST', url, body),
    patch: (url, body) => api.request('PATCH', url, body),
    delete: (url) => api.request('DELETE', url)
  }

  let pm = fakeProjectManager(api)
  api.pm = pm

  before(() => {
    api.app = create({
      loggerInstance: logger.child({}, { level: 'silent' }),
      pm,
      proto: api.proto,
      wm: { rsvp: api.rsvp }
    })
  })

  after(() => api.app.close())

  beforeEach(() => {
    response = undefined
    api.actions.length = 0
    api.rsvp.mock.resetCalls()
    api.proto.handle.mock.resetCalls()
  })

  return api
}

// A fake ProjectManager for the projects in mkapi.
const fakeProjectManager = (api) => {
  let window = (path) => {
    let id = basename(path, '.tropy')
    return (id === 'closed') ? null : api.window(id)
  }

  let describe = (path) => ({
    urlId: urlId(path),
    path,
    open: window(path) != null,
    url: protocolURL(path)
  })

  return {
    open: mock.fn(async (path) => ({ win: window(path), project: { path } })),
    find: (id) => (id === 'missing') ? null : `/projects/${id}.tropy`,
    window,
    describe,
    list: () =>
      ['/projects/foo.tropy', '/projects/closed.tropy'].map(describe)
  }
}
