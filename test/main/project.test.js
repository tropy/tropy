import { mock } from 'node:test'
import { ProjectManager } from '#tropy/main/project.js'

const fakeWindow = () => ({
  show: mock.fn()
})

describe('ProjectManager', () => {
  let file = import.meta.filename
  let wins, current, pm

  // Simulates the renderer of win reporting its project.
  let opened = (win, path) => {
    if (!wins.includes(win)) wins.push(win)
    pm.handleProjectOpened({ sender: win }, { path })
  }
  let closed = (win, path, error) =>
    pm.handleProjectClosed({ sender: win }, { path, error })

  beforeEach(() => {
    wins = []
    current = null

    pm = new ProjectManager({
      state: { recent: [file], win: {} },
      menu: { reload () {}, handleWindowChange () {} },
      dispatch: mock.fn(),
      setHistory () {},
      wm: {
        current: () => current,
        map: (_, fn = x => x) => wins.map(fn),
        has: () => wins.length > 0,
        is: () => true,
        fromEvent: ({ sender }) => sender,
        setTitle () {},
        close () {},
        sendEach () {},
        whenReady: (win, resolve) => resolve(),
        open: mock.fn(() => {
          let win = fakeWindow()
          wins.push(win)
          setImmediate(() => opened(win, file))
          return win
        })
      }
    })
  })

  it('opens a project once for concurrent requests', async () => {
    let [a, b] = await Promise.all([
      pm.openById('project.test'),
      pm.open(file)
    ])

    expect(a).to.equal(b)
    expect(pm.wm.open.mock.callCount()).to.equal(1)
    expect(pm.get(a)).to.include({ path: file })
  })

  it('rejects when the project fails to open', async () => {
    pm.wm.open.mock.mockImplementation(() => {
      let win = fakeWindow()
      setImmediate(() => closed(win, file, { message: 'corrupt' }))
      return win
    })

    let err = await pm.open(file).catch(e => e)
    expect(err).to.have.property('message', 'corrupt')
  })

  it('focuses the window of an open project', async () => {
    let win = fakeWindow()
    opened(win, file)

    expect(await pm.show(file, null)).to.equal(win)
    expect(win.show.mock.callCount()).to.equal(1)
    expect(pm.wm.open.mock.callCount()).to.equal(0)
  })

  it('opens projects in a given window', async () => {
    let win = fakeWindow()
    await pm.show(file, win)

    let [action, target] = pm.app.dispatch.mock.calls[0].arguments
    expect(action).to.have.property('payload', file)
    expect(target).to.equal(win)
  })

  it('opens projects in the empty current window or a new one', async () => {
    current = fakeWindow()
    wins.push(current)

    await pm.show(file)
    expect(pm.app.dispatch.mock.calls[0].arguments[1]).to.equal(current)

    opened(current, file)
    pm.wm.open.mock.mockImplementation(() => fakeWindow())

    await pm.show('/other.tpy')
    expect(pm.wm.open.mock.callCount()).to.equal(1)
  })

  it('does not reuse a window that is still being created', async () => {
    let created = fakeWindow()

    // The new window is current before it has loaded.
    pm.wm.open.mock.mockImplementation(() => {
      current = created
      return created
    })

    pm.show(file)

    pm.wm.open.mock.mockImplementation(() => fakeWindow())
    await pm.show('/other.tpy')

    expect(pm.app.dispatch.mock.callCount()).to.equal(0)
    expect(pm.wm.open.mock.callCount()).to.equal(2)
  })

  it('creates projects in a new empty window', async () => {
    pm.wm.open.mock.mockImplementation((type, props) => {
      let win = fakeWindow()
      expect(props.file).to.be.undefined
      setImmediate(() => opened(win, '/new.tropy'))
      return win
    })

    let win = await pm.open('/new.tropy', null, { create: { name: 'New' } })
    let [action, target] = pm.app.dispatch.mock.calls[0].arguments

    expect(target).to.equal(win)
    expect(action).to.deep.include({
      payload: '/new.tropy',
      meta: { create: { name: 'New' } }
    })
  })

  it('rejects a create when its new window closes before it is ready', async () => {
    let win = fakeWindow()
    pm.wm.open.mock.mockImplementation(() => win)

    let opening = pm.open('/new.tropy', null, { create: {} })
    // The window exists, but never becomes ready.
    await new Promise(setImmediate)
    pm.handleWindowClosed('project', win)

    let err = await opening.catch(e => e)
    expect(err).to.have.property('message', 'window closed')
  })

  it('opens projects for a renderer in its window', async () => {
    let win = fakeWindow()
    let create = { name: 'New' }

    pm.handleOpenProject(win, { path: '/new.tropy', create })

    let [action, target] = pm.app.dispatch.mock.calls[0].arguments
    expect(target).to.equal(win)
    expect(action).to.deep.include({ payload: '/new.tropy', meta: { create } })
  })

  it('opens further projects for a renderer in new windows', () => {
    let win = fakeWindow()
    current = win
    wins.push(win)

    pm.handleOpenProject(win, { path: '/a.tpy' })
    pm.handleOpenProject(win, { path: '/b.tpy' })

    expect(pm.app.dispatch.mock.calls[0].arguments[1]).to.equal(win)
    expect(pm.wm.open.mock.calls[0].arguments[1])
      .to.include({ file: '/b.tpy' })
  })

  it('focuses a project open in another window instead', async () => {
    let other = fakeWindow()
    opened(other, file)

    pm.handleOpenProject(fakeWindow(), { path: file })

    expect(other.show.mock.callCount()).to.equal(1)
    expect(pm.app.dispatch.mock.callCount()).to.equal(0)
  })

  it('resolves unknown URL ids to null', async () => {
    expect(await pm.openById('unknown')).to.be.null
  })

  it('uses the active project window for the current project', async () => {
    current = fakeWindow()
    opened(current, file)

    expect(await pm.openById('current')).to.equal(current)
    expect(pm.wm.open.mock.callCount()).to.equal(0)
  })

  it('tracks the project of each window', () => {
    let win = fakeWindow()
    opened(win, file)

    closed(win, '/other.tpy')
    expect(pm.get(win)).to.include({ path: file })

    closed(win, file)
    expect(pm.get(win)).to.be.null
  })

  it('keeps open projects when clearing recent projects', () => {
    let win = fakeWindow()
    opened(win, '/b.tpy')

    pm.app.state.recent = ['/a.tpy', '/b.tpy', '/c.tpy']
    pm.clear(['/a.tpy', '/b.tpy'])
    expect(pm.recent).to.eql(['/b.tpy', '/c.tpy'])

    pm.clear()
    expect(pm.recent).to.eql(['/b.tpy'])
  })
})
