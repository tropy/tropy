import { mock } from 'node:test'
import { logger } from '#tropy/common/log.js'
import { HttpError } from '#tropy/common/error.js'
import { create } from '#tropy/main/api/app.js'

// Sets up an API instance whose project window is a fake:
// it records dispatched actions in api.actions and responds
// with api.respond(payload) or api.respond(action => payload).
//
// Any project id resolves to /projects/:id.tropy, except
// 'missing' (unknown project) and ids starting with 'twin' (ambiguous).
// Like the real server, resolved ids are URL-encoded.
//
// Requests send bodies as JSON, like curl --json.
export function mkapi () {
  let response

  let api = {
    app: null,
    actions: [],
    win: {},

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
      current: () => '/projects/current.tropy',
      log: logger.child({}, { level: 'silent' }),
      resolveProject,
      rsvp: api.rsvp,
      version: '1.0.0'
    })
  })

  after(() => api.app.close())

  beforeEach(() => {
    response = undefined
    api.actions.length = 0
    api.rsvp.mock.resetCalls()
  })

  function resolveProject (id) {
    if (id === 'missing')
      throw new HttpError({ status: 404, body: `unknown project: ${id}` })

    return {
      win: api.win,
      path: `/projects/${id}.tropy`,
      id: encodeURIComponent(id),
      ambiguous: id.startsWith('twin')
    }
  }

  return api
}
