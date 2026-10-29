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
      wm: {
        current: () => null,
        rsvp: mock.fn(async () => ({ payload: {} }))
      },
      pm: {
        openByUrlId: mock.fn(async (id) =>
          (id === 'Kraków Atlas' || id === 'current') ?
            { win, project: { path: '/Kraków Atlas.tropy' } } :
            null),
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

      expect(route).to.include.keys('operationId', 'summary', 'url')
      expect(params.filter(name => query.includes(name))).to.be.empty
    }

    expect(proto.routes.map(route => route.url)).to.include.members([
      'tropy://project[/{urlId}]',
      'tropy://project/{urlId}/items',
      'tropy://project/{urlId}/items/{item}[/{photo}][/{selection}]',
      'tropy://prefs'
    ])
  })

  it('opens projects and returns them', async () => {
    for (let url of [base, 'tropy://project', 'tropy://Project/Krak%C3%B3w%20Atlas']) {
      expect(await proto.handle(url), url)
        .to.eql({ path: '/Kraków Atlas.tropy' })
    }
  })

  it('opens items in the project window', async () => {
    for (let [url, payload] of [
      ['/items/41', { id: 41 }],
      ['/items/41/3', { id: 41, photo: 3 }],
      ['/items/41/3/7', { id: 41, photo: 3, selection: 7 }]
    ]) {
      await proto.handle(base + url)

      let [target, action] = app.wm.rsvp.mock.calls.at(-1).arguments
      expect(target).to.equal(win)
      expect(action.name, url).to.equal('item.open')
      expect(action.payload, url).to.deep.include(payload)
    }

    app.wm.rsvp.mock.mockImplementation(async () => ({ payload: null }))

    let err = await proto.handle(base + '/items/41/3').catch(e => e)
    expect(err).to.have.property('status', 404)
  })

  it('navigates within the project window', async () => {
    for (let [url, name, payload] of [
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
    expect(app.pm.pick.mock.callCount()).to.equal(1)

    app.pm.openByUrlId.mock.mockImplementation(async () => null)

    expect(await proto.handle('tropy://project', { prompt: true }))
      .to.be.null
    expect(app.pm.show.mock.callCount()).to.equal(1)
  })

  it('reports failures to open projects', async () => {
    app.pm.openByUrlId.mock.mockImplementation(async () => {
      throw new Error('corrupt')
    })
    let err = await proto.handle(base).catch(e => e)
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

    expect(app.pm.openByUrlId.mock.callCount()).to.equal(0)
  })
})
