import { mkapi } from '../../support/api.js'
import { API, ITEM, METADATA, TAG } from '#tropy/constants/index.js'

describe('api', () => {
  let api = mkapi()

  describe('server', () => {
    it('reports status', async () => {
      expect((await api.get('/')).json()).to.eql({
        project: '/projects/current.tropy',
        status: 'ok',
        version: '1.0.0'
      })

      expect((await api.get('/version')).json()).to.eql({ version: '1.0.0' })
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

    it('redirects legacy URLs to the current project', async () => {
      let res = await api.get('/project/items/42/tags?reverse=true')

      expect(res.statusCode).to.equal(308)
      expect(res.headers.location)
        .to.equal('/project/current/items/42/tags?reverse=true')
    })

    it('resolves projects', async () => {
      expect((await api.get('/project/foo')).json())
        .to.include({ project: '/projects/foo.tropy', id: 'foo' })

      // resolveProject expects decoded ids
      expect((await api.get('/project/Krak%C3%B3w%20Atlas')).json())
        .to.include({ project: '/projects/Kraków Atlas.tropy' })
    })

    it('warns about ambiguous project ids', async () => {
      let res = await api.get('/project/twin/')

      expect(res.statusCode).to.equal(200)
      expect(res.headers.warning).to.match(/ambiguous/)

      // Header values must not contain non-Latin-1 characters
      res = await api.get('/project/twin%E6%9D%B1%E4%BA%AC')
      expect(res.statusCode).to.equal(200)
      expect(res.headers.warning).to.include('twin%E6%9D%B1%E4%BA%AC')
    })

    it('responds with JSON errors for unknown projects', async () => {
      let res = await api.get('/project/missing/items')

      expect(res.statusCode).to.equal(404)
      expect(res.json()).to.include({ message: 'unknown project: missing' })
      expect(api.actions).to.be.empty
    })
  })

  describe('requests', () => {
    it('hands actions off to the project window', async () => {
      api.respond({ id: 42 })
      let res = await api.get('/project/foo/items/42')

      expect(res.json()).to.eql({ id: 42 })
      expect(api.rsvp.mock.calls[0].arguments[0]).to.equal(api.win)
      expect(api.action.type).to.equal(API.ITEM.SHOW)
      expect(api.action.meta).to.include({ silent: true })
      expect(api.action.payload).to.eql({ id: 42 })
    })

    it('responds with 404 when nothing is found', async () => {
      let res = await api.get('/project/foo/items/42')

      expect(res.statusCode).to.equal(404)
      expect(res.json()).to.include({ code: 'NOT_FOUND' })
    })

    it('responds when commands return nothing', async () => {
      let res = await api.delete('/project/foo/tags', 'tag=Foo')

      expect(res.statusCode).to.equal(200)
      expect(res.body).to.equal('')
    })

    it('maps window errors to HTTP status codes', async () => {
      for (let [code, status] of [
        ['ETIMEDOUT', 504],
        ['ECANCELED', 503],
        ['EOTHER', 500]
      ]) {
        api.respond(() => { throw Object.assign(new Error(code), { code }) })
        expect((await api.get('/project/foo/items/1')).statusCode)
          .to.equal(status)
      }
    })

    it('validates params, queries and bodies', async () => {
      for (let res of [
        await api.get('/project/foo/items/abc'),
        await api.get('/project/foo/photos/1/file.gif'),
        await api.get('/project/foo/notes/1?format=pdf'),
        await api.get('/project/foo/items/0'),
        await api.post('/project/foo/tags', 'color=red'),
        await api.post('/project/foo/notes', 'html=x&photo=0'),
        await api.post('/project/foo/data/1')
      ]) {
        expect(res.statusCode).to.equal(400)
      }

      expect(api.actions).to.be.empty
    })

    it('accepts form and JSON bodies', async () => {
      await api.post('/project/foo/tags', 'name=Foo&item=1&item=2')
      expect(api.action.payload).to.deep.include({ name: 'Foo', items: [1, 2] })

      await api.post('/project/foo/tags', { name: 'Foo', item: [1, 2] })
      expect(api.action.payload).to.deep.include({ name: 'Foo', items: [1, 2] })
    })
  })

  describe('items', () => {
    it('finds items by tag', async () => {
      api.respond([{ id: 1 }])
      let res = await api.get('/project/foo/items?tag=1&tag=2&reverse=true')

      expect(res.json()).to.eql([{ id: 1 }])
      expect(api.action.type).to.equal(API.ITEM.FIND)
      expect(api.action.payload).to.deep.include({
        tags: [1, 2],
        sort: { column: 'item.created', asc: false }
      })
    })

    it('clears all tags when no tag is given', async () => {
      let res = await api.delete('/project/foo/items/1/tags')

      expect(res.statusCode).to.equal(200)
      expect(api.action.type).to.equal(ITEM.TAG.CLEAR)
    })
  })

  describe('lists', () => {
    it('shows the root list', async () => {
      api.respond([])
      let res = await api.get('/project/foo/lists/0')

      expect(res.statusCode).to.equal(200)
      expect(api.action.payload).to.include({ id: 0 })
    })
  })

  describe('import', () => {
    it('imports files without a timeout', async () => {
      api.respond([1])
      let res = await api.post('/project/foo/import', 'file=/a.jpg&createLists=true')

      expect(res.json()).to.eql([1])
      expect(api.action.type).to.equal(ITEM.IMPORT)
      expect(api.action.payload.files).to.eql(['/a.jpg'])
      expect(api.action.meta).to.include({ createLists: true })
      expect(api.rsvp.mock.calls[0].arguments[2]).to.eql({ timeout: 0 })
    })

    it('imports JSON data', async () => {
      let data = [{ 'http://purl.org/dc/terms/title': 'Map' }]

      await api.post('/project/foo/import', { data, list: 2 })
      expect(api.action.payload).to.deep.include({ data, list: 2 })

      await api.post('/project/foo/import',
        `data=${encodeURIComponent(JSON.stringify(data))}`)
      expect(api.action.payload).to.deep.include({ data })
    })
  })

  describe('metadata', () => {
    it('saves metadata', async () => {
      let res = await api.post('/project/foo/data/5', 'title=Map')

      expect(res.statusCode).to.equal(200)
      expect(api.action.type).to.equal(METADATA.SAVE)
      expect(api.action.payload).to.eql({ ids: [5], data: { title: 'Map' } })
    })
  })

  describe('notes', () => {
    it('responds in the requested format', async () => {
      api.respond('# Note')
      let res = await api.get('/project/foo/notes/1?format=md')

      expect(res.headers['content-type']).to.match(/^text\/markdown/)
      expect(res.body).to.equal('# Note')
    })

    it('requires a photo or selection', async () => {
      let res = await api.post('/project/foo/notes', 'html=<p>x</p>')

      expect(res.statusCode).to.equal(400)
      expect(res.json().message).to.match(/photo or selection/)
    })
  })

  describe('tags', () => {
    it('creates tags', async () => {
      api.respond({ id: 3 })
      let res = await api.post('/project/foo/tags', { name: 'Foo' })

      expect(res.json()).to.eql({ id: 3 })
      expect(api.action.type).to.equal(TAG.CREATE)
    })
  })

  describe('photos', () => {
    it('extracts images', async () => {
      api.respond({ data: [1, 2, 3], format: 'png' })
      let res = await api.get('/project/foo/photos/7/file.png')

      expect(res.headers['content-type']).to.equal('image/png')
      expect([...res.rawPayload]).to.eql([1, 2, 3])
      expect(api.action.payload).to.include({ id: 7 })
    })

    it('serves raw photo files', async () => {
      api.respond({
        protocol: 'file',
        path: F.image.path('PA140105.JPG'),
        mimetype: 'image/jpeg'
      })
      let res = await api.get('/project/foo/photos/1/raw')

      expect(res.statusCode).to.equal(200)
      expect(res.headers['content-type']).to.equal('image/jpeg')
      expect(res.headers['content-disposition'])
        .to.equal('attachment; filename*=UTF-8\'\'PA140105.JPG')
      expect(res.rawPayload.length)
        .to.equal(Number(res.headers['content-length']))
    })

    it('serves raw photo files of unknown type', async () => {
      api.respond({
        protocol: 'file',
        path: F.image.path('PA140105.JPG')
      })
      let res = await api.get('/project/foo/photos/1/raw')

      expect(res.statusCode).to.equal(200)
      expect(res.headers['content-type']).to.equal('application/octet-stream')
    })

    it('responds with 404 for missing photo files', async () => {
      api.respond({
        protocol: 'file',
        path: F.image.path('missing.jpg'),
        mimetype: 'image/jpeg'
      })
      let res = await api.get('/project/foo/photos/1/raw')

      expect(res.statusCode).to.equal(404)
    })
  })
})
