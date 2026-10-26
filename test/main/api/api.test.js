import { mkapi } from '../../support/api.js'
import { API, ITEM, METADATA, TAG } from '#tropy/constants/index.js'

describe('api', () => {
  let api = mkapi()

  describe('server', () => {
    it('reports status', async () => {
      expect((await api.get('/')).json()).to.eql({
        status: 'ok',
        version: '2.0.0'
      })

    })

    it('rejects foreign hosts and cross-origin requests', async () => {
      for (let headers of [
        { host: 'evil.com' },
        { origin: 'https://evil.com' },
        { 'sec-fetch-site': 'cross-site' }
      ]) {
        let res = await api.app.inject({ url: '/', headers })
        expect(res.statusCode).to.equal(403)
      }
    })

    it('redirects legacy URLs', async () => {
      for (let [url, location] of [
        ['/project/items/42/tags?reverse=true', '/projects/current/items/42/tags?reverse=true'],
        ['/project/foo/items/42', '/projects/foo/items/42']
      ]) {
        let res = await api.get(url)

        expect(res.statusCode).to.equal(308)
        expect(res.headers.location).to.equal(location)
      }
    })

    it('lists known projects', async () => {
      expect((await api.get('/projects')).json()).to.eql([
        {
          urlId: 'foo',
          path: '/projects/foo.tropy',
          open: true,
          url: 'tropy://project/foo'
        },
        {
          urlId: 'closed',
          path: '/projects/closed.tropy',
          open: false,
          url: 'tropy://project/closed'
        }
      ])
    })

    it('shows known projects', async () => {
      // URL ids are decoded for lookup, encoded in responses
      expect((await api.get('/projects/Krak%C3%B3w%20Atlas')).json())
        .to.include({
          urlId: 'Krak%C3%B3w%20Atlas',
          path: '/projects/Kraków Atlas.tropy'
        })

      expect((await api.get('/projects/missing')).statusCode).to.equal(404)
    })

    it('requires projects to be open', async () => {
      let res = await api.get('/projects/closed/items')

      expect(res.statusCode).to.equal(409)
      expect(res.json().detail).to.include('tropy://project/closed')
      expect(api.actions).to.be.empty
    })

    it('responds with problem details for unknown projects', async () => {
      let res = await api.get('/projects/missing/items')

      expect(res.statusCode).to.equal(404)
      expect(res.headers['content-type']).to.match(/^application\/problem\+json/)
      expect(res.json()).to.eql({
        title: 'Not Found',
        status: 404,
        detail: 'unknown project: missing',
        code: 'NOT_FOUND'
      })
      expect(api.actions).to.be.empty
    })

    it('responds with problem details for unknown routes', async () => {
      let res = await api.get('/nothing/here')

      expect(res.statusCode).to.equal(404)
      expect(res.headers['content-type']).to.match(/^application\/problem\+json/)
      expect(res.json()).to.include({ detail: 'route not found: GET /nothing/here' })
    })
  })

  describe('requests', () => {
    it('hands actions off to the project window', async () => {
      api.respond({ id: 42 })
      let res = await api.get('/projects/foo/items/42')

      expect(res.json()).to.eql({ id: 42 })
      expect(api.rsvp.mock.calls[0].arguments[0]).to.equal(api.window('foo'))
      expect(api.action.type).to.equal(API.ITEM.SHOW)
      expect(api.action.meta).to.include({ silent: true })
      expect(api.action.payload).to.eql({ id: 42 })
    })

    it('responds with 404 when nothing is found', async () => {
      let res = await api.get('/projects/foo/items/42')

      expect(res.statusCode).to.equal(404)
      expect(res.json()).to.include({ code: 'NOT_FOUND' })
    })

    it('responds with 204 when commands return nothing', async () => {
      let res = await api.delete('/projects/foo/items/1/tags?tag=Foo')

      expect(res.statusCode).to.equal(204)
      expect(api.action.payload).to.eql({ id: [1], tags: ['Foo'] })
    })

    it('maps window errors to HTTP status codes', async () => {
      for (let [code, status] of [
        ['ETIMEDOUT', 504],
        ['ECANCELED', 503],
        ['EOTHER', 500]
      ]) {
        api.respond(() => { throw Object.assign(new Error(code), { code }) })
        expect((await api.get('/projects/foo/items/1')).statusCode)
          .to.equal(status)
      }
    })

    it('lists validation errors', async () => {
      let res = await api.post('/projects/foo/tags', { name: '', items: [0] })

      expect(res.json()).to.include({ status: 400, code: 'FST_ERR_VALIDATION' })
      expect(res.json().errors).to.eql([
        { in: 'body', pointer: '/name', detail: 'must NOT have fewer than 1 characters' },
        { in: 'body', pointer: '/items/0', detail: 'must be >= 1' }
      ])
    })

    it('validates params, queries and bodies', async () => {
      for (let res of [
        await api.get('/projects/foo/items/abc'),
        await api.get('/projects/foo/photos/1/file.gif'),
        await api.get('/projects/foo/photos/1/file.raw'),
        await api.get('/projects/foo/items/0'),
        await api.get('/projects/foo/lists/1?expand'),
        await api.post('/projects/foo/lists', { name: 'Foo', parent: '2' }),
        await api.post('/projects/foo/tags', { color: 'red' }),
        await api.post('/projects/foo/notes', { html: 'x', photo: 0 }),
        await api.post('/projects/foo/import', { data: 'nope' }),
        await api.patch('/projects/foo/data/1')
      ]) {
        expect(res.statusCode).to.equal(400)
      }

      expect(api.actions).to.be.empty
    })

    it('rejects unknown parameters', async () => {
      for (let [res, pointer] of [
        [await api.get('/projects/foo/items?tags=1'), '/tags'],
        [await api.post('/projects/foo/tags', { name: 'Foo', item: [1] }), '/item']
      ]) {
        expect(res.statusCode).to.equal(400)
        expect(res.json().errors.map(e => e.pointer)).to.include(pointer)
      }

      expect(api.actions).to.be.empty
    })

    it('accepts only JSON bodies', async () => {
      let res = await api.app.inject({
        method: 'POST',
        url: '/projects/foo/tags',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        payload: 'name=Foo'
      })

      expect(res.statusCode).to.equal(415)
      expect(api.actions).to.be.empty
    })
  })

  describe('items', () => {
    it('finds items by tag', async () => {
      api.respond([{ id: 1 }])
      let res = await api.get('/projects/foo/items?tag=1&tag=2&reverse=true')

      expect(res.json()).to.eql([{ id: 1 }])
      expect(api.action.type).to.equal(API.ITEM.FIND)
      expect(api.action.payload).to.deep.include({
        tags: [1, 2],
        sort: { column: 'item.created', asc: false }
      })
    })

    it('clears all tags when no tag is given', async () => {
      let res = await api.delete('/projects/foo/items/1/tags')

      expect(res.statusCode).to.equal(204)
      expect(api.action.type).to.equal(ITEM.TAG.CLEAR)
    })
  })

  describe('lists', () => {
    it('shows the root list', async () => {
      api.respond([])
      for (let url of ['/projects/foo/lists/0', '/projects/foo/lists']) {
        let res = await api.get(url)

        expect(res.statusCode).to.equal(200)
        expect(api.action.payload).to.include({ id: 0 })
      }
    })
  })

  describe('import', () => {
    it('imports files without a timeout', async () => {
      api.respond([1])
      let res = await api.post('/projects/foo/import', {
        files: ['/a.jpg'],
        createLists: true
      })

      expect(res.statusCode).to.equal(201)
      expect(res.json()).to.eql([1])
      expect(api.action.type).to.equal(ITEM.IMPORT)
      expect(api.action.payload.files).to.eql(['/a.jpg'])
      expect(api.action.meta).to.include({ createLists: true })
      expect(api.rsvp.mock.calls[0].arguments[2]).to.eql({ timeout: 0 })
    })

    it('imports JSON data', async () => {
      let data = [{ 'http://purl.org/dc/terms/title': 'Map' }]

      await api.post('/projects/foo/import', { data, list: 2 })
      expect(api.action.payload).to.deep.include({ data, list: 2 })
    })
  })

  describe('metadata', () => {
    it('saves metadata', async () => {
      let res = await api.patch('/projects/foo/data/5', { title: 'Map' })

      expect(res.statusCode).to.equal(204)
      expect(api.action.type).to.equal(METADATA.SAVE)
      expect(api.action.payload).to.eql({ ids: [5], data: { title: 'Map' } })
    })
  })

  describe('notes', () => {
    it('responds in the requested format', async () => {
      api.respond('# Note')
      let res = await api.app.inject({
        url: '/projects/foo/notes/1',
        headers: { accept: 'text/markdown' }
      })

      expect(res.headers['content-type']).to.match(/^text\/markdown/)
      expect(res.body).to.equal('# Note')
    })

    it('negotiates the format', async () => {
      for (let [accept, format] of [
        [undefined, 'json'],
        ['*/*', 'json'],
        ['text/html,*/*;q=0.8', 'html'],
        ['text/markdown', 'markdown'],
        ['application/json;q=0, text/*, text/html;q=0.5', 'text']
      ]) {
        api.respond(({ payload }) => payload.format === 'json' ? {} : 'Note')
        let res = await api.app.inject({
          url: '/projects/foo/notes/1',
          headers: accept ? { accept } : {}
        })

        expect(res.statusCode).to.equal(200)
        expect(api.action.payload).to.include({ format })
      }

      let res = await api.app.inject({
        url: '/projects/foo/notes/1',
        headers: { accept: 'image/png' }
      })

      expect(res.statusCode).to.equal(406)
      expect(api.actions).to.have.length(5)
    })

    it('requires either a photo or a selection', async () => {
      let res = await api.post('/projects/foo/notes', { html: '<p>x</p>' })

      expect(res.statusCode).to.equal(400)
      expect(res.json().errors.map(e => e.pointer))
        .to.include.members(['/photo', '/selection'])

      res = await api.post('/projects/foo/notes', {
        html: '<p>x</p>',
        photo: 1,
        selection: 2
      })

      expect(res.statusCode).to.equal(400)
      expect(api.actions).to.be.empty
    })

    it('deletes notes', async () => {
      api.respond([1])
      expect((await api.delete('/projects/foo/notes/1')).statusCode).to.equal(204)

      api.respond(null)
      expect((await api.delete('/projects/foo/notes/1')).statusCode).to.equal(404)
    })

    it('responds with 404 for unknown photos or selections', async () => {
      let res = await api.post('/projects/foo/notes', { html: '<p>x</p>', photo: 1 })
      expect(res.statusCode).to.equal(404)
    })
  })

  describe('transcriptions', () => {
    it('has no HTML format', async () => {
      let res = await api.app.inject({
        url: '/projects/foo/transcriptions/1',
        headers: { accept: 'text/html' }
      })

      expect(res.statusCode).to.equal(406)
    })
  })

  describe('tags', () => {
    it('creates tags', async () => {
      api.respond({ id: 3 })
      let res = await api.post('/projects/foo/tags', { name: 'Foo' })

      expect(res.statusCode).to.equal(201)
      expect(res.json()).to.eql({ id: 3 })
      expect(api.action.type).to.equal(TAG.CREATE)
    })

    it('looks up tags by id or name', async () => {
      api.respond({ id: 3 })

      expect((await api.get('/projects/foo/tags?name=Foo')).json())
        .to.eql([{ id: 3 }])
      expect(api.action.payload).to.eql({ name: 'Foo' })

      expect((await api.get('/projects/foo/tags/Foo')).statusCode)
        .to.equal(400)
    })

    it('deletes tags by id', async () => {
      api.respond(3)
      expect((await api.delete('/projects/foo/tags/3')).statusCode).to.equal(204)
      expect(api.action).to.include({ type: TAG.DELETE, payload: 3 })

      api.respond(null)
      expect((await api.delete('/projects/foo/tags/3')).statusCode).to.equal(404)
    })
  })

  describe('photos', () => {
    it('extracts images', async () => {
      api.respond({ data: [1, 2, 3], format: 'png' })
      let res = await api.get('/projects/foo/photos/7/file.png')

      expect(res.headers['content-type']).to.equal('image/png')
      expect([...res.rawPayload]).to.eql([1, 2, 3])
      expect(api.action.payload).to.include({ id: 7 })
    })

    it('serves original photo files', async () => {
      api.respond({
        protocol: 'file',
        path: F.image.path('PA140105.JPG'),
        mimetype: 'image/jpeg'
      })
      let res = await api.get('/projects/foo/photos/1/original')

      expect(res.statusCode).to.equal(200)
      expect(res.headers['content-type']).to.equal('image/jpeg')
      expect(res.headers['content-disposition'])
        .to.equal('attachment; filename*=UTF-8\'\'PA140105.JPG')
      expect(res.rawPayload.length)
        .to.equal(Number(res.headers['content-length']))
    })

    it('guesses the type of original photo files without one', async () => {
      api.respond({
        protocol: 'file',
        path: F.image.path('PA140105.JPG')
      })
      let res = await api.get('/projects/foo/photos/1/original')

      expect(res.statusCode).to.equal(200)
      expect(res.headers['content-type']).to.equal('image/jpeg')
    })

    it('supports range and conditional requests', async () => {
      let url = '/projects/foo/photos/1/original'
      api.respond({ protocol: 'file', path: F.image.path('PA140105.JPG') })

      let res = await api.app.inject({ url, headers: { range: 'bytes=0-9' } })
      expect(res.statusCode).to.equal(206)
      expect(res.rawPayload.length).to.equal(10)

      res = await api.app.inject({
        url,
        headers: { 'if-none-match': res.headers.etag }
      })
      expect(res.statusCode).to.equal(304)
    })

    it('responds with 404 for missing photo files', async () => {
      api.respond({
        protocol: 'file',
        path: F.image.path('missing.jpg'),
        mimetype: 'image/jpeg'
      })
      let res = await api.get('/projects/foo/photos/1/original')

      expect(res.statusCode).to.equal(404)
    })
  })
})
