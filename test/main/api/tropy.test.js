import { mock } from 'node:test'
import { handle } from '#tropy/main/api/tropy.js'

describe('tropy:// urls', () => {
  let win, app

  beforeEach(() => {
    win = { show: mock.fn() }

    app = {
      dispatch: mock.fn(),
      wm: { current: () => null },
      projects: {
        openById: mock.fn(async (id) => (id === 'Kraków Atlas') ? win : null),
        get: () => ({ path: '/Kraków Atlas.tropy' }),
        describe: (path) => ({ path }),
        window: () => win,
        pick: mock.fn(async () => null)
      }
    }
  })

  it('opens projects and returns them', async () => {
    expect(await handle(app, 'tropy://project/Krak%C3%B3w%20Atlas'))
      .to.eql({ path: '/Kraków Atlas.tropy' })

    expect(win.show.mock.callCount()).to.equal(1)

    await handle(app, 'tropy://project').catch(() => {})
    expect(app.projects.openById.mock.calls.at(-1).arguments[0])
      .to.equal('current')
  })

  it('opens items in the project window', async () => {
    await handle(app, 'tropy://project/Krak%C3%B3w%20Atlas/items/41/3')
    await handle(app, 'tropy://project/Krak%C3%B3w%20Atlas/items/41/3/7')

    let [[first, target], [second]] =
      app.dispatch.mock.calls.map(call => call.arguments)

    expect(first.payload).to.include({ id: 41, photo: 3 })
    expect(second.payload).to.include({ id: 41, photo: 3, selection: 7 })
    expect(target).to.equal(win)
  })

  it('rejects unknown projects unless prompted', async () => {
    let err = await handle(app, 'tropy://project/other').catch(e => e)
    expect(err).to.have.property('status', 404)

    await handle(app, 'tropy://project/other', { prompt: true })
    expect(app.projects.pick.mock.callCount()).to.equal(1)
  })

  it('rejects invalid and unknown urls', async () => {
    for (let [url, status] of [
      ['nope', 400],
      ['http://project/x', 400],
      ['tropy://project/x/items/0/3', 400],
      ['tropy://project/x/items/a/3', 400],
      ['tropy://project/x/lists/1', 404],
      ['tropy://project/x/', 404],
      ['tropy://nothing', 404]
    ]) {
      let err = await handle(app, url).catch(e => e)
      expect(err, url).to.have.property('status', status)
    }

    expect(app.projects.openById.mock.callCount()).to.equal(0)
  })
})
