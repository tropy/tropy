import { mock } from 'node:test'
import { BrowserWindow } from 'electron'
import { ProjectRegistry } from '#tropy/main/project.js'

const fakeWindow = () => ({
  show: mock.fn(),
  setTitle: mock.fn()
})

describe('ProjectRegistry', () => {
  let file = import.meta.filename
  let wins, current, projects, fromWebContents

  // Simulates the renderer of win reporting its project.
  let opened = (win, path) => {
    if (!wins.includes(win)) wins.push(win)
    projects.handleProjectOpened({ sender: win }, { path })
  }
  let closed = (win, path, error) =>
    projects.handleProjectClosed({ sender: win }, { path, error })

  beforeEach(() => {
    wins = []
    current = null

    fromWebContents = mock.method(BrowserWindow, 'fromWebContents', (wc) => wc)

    projects = new ProjectRegistry({
      state: { recent: [file], frameless: true, win: {} },
      hash: {},
      menu: { reload () {}, handleWindowChange () {} },
      dispatch: mock.fn(),
      setHistory () {},
      wm: {
        current: () => current,
        map: (_, fn = x => x) => wins.map(fn),
        has: () => wins.length > 0,
        is: () => true,
        close () {},
        send () {},
        open: mock.fn(async () => {
          let win = fakeWindow()
          wins.push(win)
          setImmediate(() => opened(win, file))
          return win
        })
      }
    })
  })

  afterEach(() => {
    fromWebContents.mock.restore()
  })

  it('opens a project once for concurrent requests', async () => {
    let [a, b] = await Promise.all([
      projects.openById('project.test'),
      projects.open(file)
    ])

    expect(a).to.equal(b)
    expect(projects.wm.open.mock.callCount()).to.equal(1)
    expect(projects.get(a)).to.include({ path: file })
  })

  it('rejects when the project fails to open', async () => {
    projects.wm.open.mock.mockImplementation(async () => {
      let win = fakeWindow()
      setImmediate(() => closed(win, file, { message: 'corrupt' }))
      return win
    })

    let err = await projects.open(file).catch(e => e)
    expect(err).to.have.property('message', 'corrupt')
  })

  it('focuses the window of an open project', async () => {
    let win = fakeWindow()
    opened(win, file)

    expect(await projects.show(file, null)).to.equal(win)
    expect(win.show.mock.callCount()).to.equal(1)
    expect(projects.wm.open.mock.callCount()).to.equal(0)
  })

  it('opens projects in a given window', async () => {
    let win = fakeWindow()
    await projects.show(file, win)

    let [action, target] = projects.app.dispatch.mock.calls[0].arguments
    expect(action).to.have.property('payload', file)
    expect(target).to.equal(win)
  })

  it('opens projects in the empty current window or a new one', async () => {
    current = fakeWindow()
    wins.push(current)

    await projects.show(file)
    expect(projects.app.dispatch.mock.calls[0].arguments[1]).to.equal(current)

    opened(current, file)
    projects.wm.open.mock.mockImplementation(async () => fakeWindow())

    await projects.show('/other.tpy')
    expect(projects.wm.open.mock.callCount()).to.equal(1)
  })

  it('does not reuse a window that is still being created', async () => {
    let created = fakeWindow()

    // The new window is current before wm.open resolves.
    projects.wm.open.mock.mockImplementation(() => {
      current = created
      return new Promise(() => {})
    })

    projects.show(file)

    projects.wm.open.mock.mockImplementation(async () => fakeWindow())
    await projects.show('/other.tpy')

    expect(projects.app.dispatch.mock.callCount()).to.equal(0)
    expect(projects.wm.open.mock.callCount()).to.equal(2)
  })

  it('creates projects in a new empty window', async () => {
    projects.wm.open.mock.mockImplementation(async (type, props) => {
      let win = fakeWindow()
      expect(props.file).to.be.undefined
      setImmediate(() => opened(win, '/new.tropy'))
      return win
    })

    let win = await projects.open('/new.tropy', null, { create: { name: 'New' } })
    let [action, target] = projects.app.dispatch.mock.calls[0].arguments

    expect(target).to.equal(win)
    expect(action).to.deep.include({
      payload: '/new.tropy',
      meta: { create: { name: 'New' } }
    })
  })

  it('rejects a create when its new window closes before it is ready', async () => {
    let win = fakeWindow()
    win.ready = new Promise(() => {})
    projects.wm.open.mock.mockImplementation(async () => win)

    let opening = projects.open('/new.tropy', null, { create: {} })
    // The window exists, but never becomes ready.
    await new Promise(setImmediate)
    projects.handleWindowClosed('project', win)

    let err = await opening.catch(e => e)
    expect(err).to.have.property('message', 'window closed')
  })

  it('resolves unknown URL ids to null', async () => {
    expect(await projects.openById('unknown')).to.be.null
  })

  it('uses the active project window for the current project', async () => {
    current = fakeWindow()
    opened(current, file)

    expect(await projects.openById('current')).to.equal(current)
    expect(projects.wm.open.mock.callCount()).to.equal(0)
  })

  it('tracks the project of each window', () => {
    let win = fakeWindow()
    opened(win, file)

    closed(win, '/other.tpy')
    expect(projects.get(win)).to.include({ path: file })

    closed(win, file)
    expect(projects.get(win)).to.be.null
  })

  it('keeps open projects when clearing recent projects', () => {
    let win = fakeWindow()
    opened(win, '/b.tpy')

    projects.app.state.recent = ['/a.tpy', '/b.tpy', '/c.tpy']
    projects.clear(['/a.tpy', '/b.tpy'])
    expect(projects.recent).to.eql(['/b.tpy', '/c.tpy'])

    projects.clear()
    expect(projects.recent).to.eql(['/b.tpy'])
  })
})
