import { mock } from 'node:test'
import { logger } from '#tropy/common/log.js'
import { create } from '#tropy/main/api/api.js'

// Sets up an API instance whose project windows are fakes:
// it records dispatched actions in api.actions and responds
// with api.respond(payload) or api.respond(action => payload).
//
// Any project id resolves to /projects/:id.tropy, except
// 'missing' (unknown project).
//
// Requests send bodies as JSON, like curl --json.
export function mkapi () {
  let response

  let windows = {}

  let api = {
    app: null,
    actions: [],

    // The fake window of the project with id.
    window (id) {
      windows[id] ??= { project: { path: `/projects/${id}.tropy` } }
      return windows[id]
    },

    get action () {
      return api.actions.at(-1)
    },

    respond (value) {
      response = value
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

    get: (url) => api.request('GET', url),
    post: (url, body) => api.request('POST', url, body),
    patch: (url, body) => api.request('PATCH', url, body),
    delete: (url) => api.request('DELETE', url)
  }

  before(() => {
    api.app = create({
      log: logger.child({}, { level: 'silent' }),
      projects: {
        openById: async (id) => (id === 'missing') ? null : api.window(id),
        get: (win) => win.project
      },
      version: '2.0.0',
      wm: { rsvp: api.rsvp }
    })
  })

  after(() => api.app.close())

  beforeEach(() => {
    response = undefined
    api.actions.length = 0
    api.rsvp.mock.resetCalls()
  })

  return api
}
