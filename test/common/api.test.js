import { once } from 'node:events'
import { HttpError } from '#tropy/common/error.js'
import * as api from '#tropy/common/api.js'

describe('api', () => {
  let server, url, rsvp, resolveProject

  const context = () => ({
    current: () => '/tmp/current.tpy',
    dispatch: () => {},
    log: { debug () {}, error () {} },
    resolveProject: (id) => resolveProject(id),
    rsvp: (win, action) => rsvp(action),
    version: '1.0.0'
  })

  beforeEach(async () => {
    rsvp = async () => ({ payload: null })
    resolveProject = (id) => ({ win: {}, path: `/tmp/${id}.tpy`, id })

    server = api.create(context()).listen(0)
    await once(server, 'listening')

    url = `http://127.0.0.1:${server.address().port}`
  })

  afterEach(async () => {
    server.closeAllConnections()
    server.close()
    await once(server, 'close')
  })

  describe('GET /version', () => {
    it('returns the version', async () => {
      let res = await fetch(`${url}/version`)

      expect(res.status).to.equal(200)
      expect(await res.json()).to.eql({ version: '1.0.0' })
    })
  })

  describe('GET /', () => {
    it('returns the current project', async () => {
      let res = await fetch(`${url}/`)

      expect(res.status).to.equal(200)
      expect(await res.json()).to.eql({
        project: '/tmp/current.tpy',
        status: 'ok',
        version: '1.0.0'
      })
    })
  })

  describe('GET /project/:project', () => {
    it('returns the resolved project', async () => {
      let res = await fetch(`${url}/project/foo`)

      expect(res.status).to.equal(200)
      expect(await res.json()).to.eql({
        project: '/tmp/foo.tpy',
        id: 'foo',
        status: 'ok',
        version: '1.0.0'
      })
    })

    it('warns when the project url is ambiguous', async () => {
      resolveProject = (id) => ({
        win: {}, path: `/tmp/a/${id}.tpy`, id, ambiguous: true
      })

      let res = await fetch(`${url}/project/foo`)

      expect(res.status).to.equal(200)
      expect(res.headers.get('warning')).to.match(/^199 - "ambiguous/)
    })

    it('returns 404 if the project cannot be resolved', async () => {
      resolveProject = () => {
        throw new HttpError({ status: 404, body: 'unknown project: foo' })
      }

      let res = await fetch(`${url}/project/foo`)

      expect(res.status).to.equal(404)
    })
  })

  describe('GET /project/:project/items/:id', () => {
    it('returns the payload and the requested id', async () => {
      let action

      rsvp = async (a) => {
        action = a
        return { payload: { id: 42, title: 'Test' } }
      }

      let res = await fetch(`${url}/project/foo/items/42`)

      expect(res.status).to.equal(200)
      expect(await res.json()).to.have.property('title', 'Test')
      expect(action).to.have.nested.property('payload.id', '42')
    })

    it('returns 404 when the item is missing', async () => {
      let res = await fetch(`${url}/project/foo/items/42`)

      expect(res.status).to.equal(404)
    })
  })
})
