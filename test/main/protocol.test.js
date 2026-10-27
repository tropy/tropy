import { mock } from 'node:test'
import { ProtocolHandler } from '#tropy/main/protocol.js'

describe('ProtocolHandler', () => {
  let base = 'tropy://project/Krak%C3%B3w%20Atlas'
  let win, app, proto

  beforeEach(() => {
    win = {}

    app = {
      dispatch: mock.fn(),
      showAboutWindow: mock.fn(),
      showPreferencesWindow: mock.fn(),
      wm: { current: () => null },
      projects: {
        openById: mock.fn(async (id) =>
          (id === 'Kraków Atlas' || id === 'current') ? win : null),
        get: mock.fn(() => ({ path: '/Kraków Atlas.tropy' })),
        describe: (path) => ({ path }),
        pick: mock.fn(async () => null),
        show: mock.fn()
      }
    }

    proto = new ProtocolHandler(app)
  })

  it('documents routes with distinct param and query names', () => {
    for (let route of proto.routes) {
      let params = Object.keys(route.params?.properties ?? {})
      let query = Object.keys(route.query?.properties ?? {})

      expect(route.description).to.be.a('string')
      expect(params.filter(name => query.includes(name))).to.be.empty
    }
  })

  it('opens projects and returns them', async () => {
    for (let url of [base, 'tropy://project', 'tropy://Project/Krak%C3%B3w%20Atlas']) {
      expect(await proto.handle(url), url)
        .to.eql({ path: '/Kraków Atlas.tropy' })
    }
  })

  it('navigates within the project window', async () => {
    for (let [url, name, payload] of [
      ['/items/41', 'item.open', { id: 41 }],
      ['/items/41/3', 'item.open', { id: 41, photo: 3 }],
      ['/items/41/3/7', 'item.open', { id: 41, photo: 3, selection: 7 }],
      ['/items', 'nav.select', { query: '' }],
      ['/items?q=Map', 'nav.select', { query: 'Map' }],
      ['/lists/3', 'nav.select', { list: 3, query: '' }],
      ['/tags/5', 'nav.select', { tags: [5], query: '' }],
      ['/trash', 'nav.select', { trash: true, query: '' }]
    ]) {
      await proto.handle(base + url)

      let [action, target] = app.dispatch.mock.calls.at(-1).arguments
      expect(action.name, url).to.equal(name)
      expect(action.payload, url).to.deep.include(payload)
      expect(target).to.equal(win)
    }
  })

  it('shows app windows', async () => {
    for (let [url, method] of [
      ['tropy://prefs', 'showPreferencesWindow'],
      ['tropy://preferences', 'showPreferencesWindow'],
      ['tropy://about', 'showAboutWindow'],
      ['tropy://About', 'showAboutWindow'],
      ['tropy://version', 'showAboutWindow']
    ]) {
      let count = app[method].mock.callCount()

      expect(await proto.handle(url), url).to.be.null
      expect(app[method].mock.callCount(), url).to.equal(count + 1)
    }
  })

  it('rejects unknown projects unless prompted', async () => {
    let err = await proto.handle('tropy://project/other').catch(e => e)
    expect(err).to.have.property('status', 404)

    expect(await proto.handle('tropy://project/other', { prompt: true }))
      .to.be.null
    expect(app.projects.pick.mock.callCount()).to.equal(1)

    app.projects.openById.mock.mockImplementation(async () => null)

    expect(await proto.handle('tropy://project', { prompt: true }))
      .to.be.null
    expect(app.projects.show.mock.callCount()).to.equal(1)
  })

  it('reports failures to open projects', async () => {
    app.projects.get.mock.mockImplementation(() => null)
    let err = await proto.handle(base).catch(e => e)
    expect(err).to.have.property('status', 409)

    app.projects.openById.mock.mockImplementation(async () => {
      throw new Error('corrupt')
    })
    err = await proto.handle(base).catch(e => e)
    expect(err).to.include({ status: 500, message: 'corrupt' })
  })

  it('rejects invalid and unknown urls', async () => {
    for (let [url, status] of [
      ['nope', 400],
      ['http://project/x', 400],
      ['tropy://project/x/items/0/3', 400],
      ['tropy://project/x/items/a/3', 400],
      ['tropy://project/%E0%A4%A', 400],
      ['tropy://project?urlId=x', 400],
      ['tropy://project/x/items?foo=1', 400],
      ['tropy://about?x=1', 400],
      ['tropy://project/x/notes/1', 404],
      ['tropy://project/x/', 404],
      ['tropy://prefs/x', 404],
      ['tropy://nothing', 404]
    ]) {
      let err = await proto.handle(url).catch(e => e)
      expect(err, url).to.have.property('status', status)
    }

    expect(app.projects.openById.mock.callCount()).to.equal(0)
  })
})
