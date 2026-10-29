import { mock } from 'node:test'
import { resolve } from 'node:path'
import { ProjectManager } from '#tropy/main/pm.js'

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

  // Registers new windows, like the WM's open.
  let register = (open) => (...args) => {
    let win = open(...args)
    if (!wins.includes(win)) wins.push(win)
    return win
  }

  beforeEach(() => {
    wins = []
    current = null

    pm = new ProjectManager({
      state: { recent: [file] },
      menu: { reload: mock.fn(), handleWindowChange () {} },
      dispatch: mock.fn(),
      setHistory () {},
      wm: {
        current: () => current,
        values: () => wins.values(),
        is: (win, type) => type === 'project' && wins.includes(win),
        fromEvent: ({ sender }) => sender,
        first: () => null,
        setTitle: mock.fn(),
        setPersistenceId: mock.fn(),
        prune: mock.fn(),
        close: async () => {},
        sendEach () {},
        whenReady: (win, resolve) => resolve(),
        open: mock.fn(register(() => {
          let win = fakeWindow()
          // Reports to this project manager, even after its test.
          let self = pm
          setImmediate(() => {
            self.handleProjectOpened({ sender: win }, { path: file })
          })
          return win
        }))
      }
    })
  })

  it('opens a project once for concurrent requests', async () => {
    let [a, b] = await Promise.all([
      pm.openByUrlId('pm.test'),
      pm.open(file)
    ])

    expect(a.win).to.equal(b.win)
    expect(pm.wm.open.mock.callCount()).to.equal(1)
    expect(a.project).to.include({ path: file })
  })

  it('rejects when the project fails to open', async () => {
    pm.wm.open.mock.mockImplementation(register(() => {
      let win = fakeWindow()
      setImmediate(() => closed(win, file, { message: 'corrupt' }))
      return win
    }))

    let err = await pm.open(file).catch(e => e)
    expect(err).to.have.property('message', 'corrupt')
  })

  it('focuses the window of an open project', () => {
    let win = fakeWindow()
    opened(win, file)

    expect(pm.show(file)).to.equal(win)
    expect(win.show.mock.callCount()).to.equal(1)
    expect(pm.wm.open.mock.callCount()).to.equal(0)
  })

  it('opens projects in a given window', () => {
    let win = fakeWindow()
    pm.show(file, { win })

    let [action, target] = pm.app.dispatch.mock.calls[0].arguments
    expect(action).to.have.property('payload', file)
    expect(target).to.equal(win)
  })

  it('opens projects in the empty current window or a new one', () => {
    current = fakeWindow()
    wins.push(current)

    pm.show(file)
    expect(pm.app.dispatch.mock.calls[0].arguments[1]).to.equal(current)

    opened(current, file)
    pm.wm.open.mock.mockImplementation(register(() => fakeWindow()))

    pm.show('/other.tpy')
    expect(pm.wm.open.mock.callCount()).to.equal(1)
  })

  it('shows the empty current window or a new one without a path', () => {
    current = fakeWindow()
    wins.push(current)

    expect(pm.show()).to.equal(current)
    expect(current.show.mock.callCount()).to.equal(1)

    opened(current, file)
    pm.wm.open.mock.mockImplementation(register(() => fakeWindow()))

    expect(pm.show()).not.to.equal(current)
    expect(pm.wm.open.mock.callCount()).to.equal(1)
  })

  it('resolves opens of open projects right away', async () => {
    let win = fakeWindow()
    opened(win, file)

    let { win: shown, project } = await pm.open(file)

    expect(shown).to.equal(win)
    expect(project).to.include({ path: file })
    expect(pm.wm.open.mock.callCount()).to.equal(0)
  })

  it('switches projects in the window of the old project', async () => {
    let win = fakeWindow()
    let path = resolve('/new.tpy')
    opened(win, '/old.tpy')

    await pm.handleSwitchProject(null, { path, old: '/old.tpy' })

    let [action, target] = pm.app.dispatch.mock.calls[0].arguments
    expect(action).to.have.property('payload', path)
    expect(target).to.equal(win)
  })

  it('does not reuse a window that is opening a project', () => {
    let created = fakeWindow()

    // The new window is current before it has loaded.
    pm.wm.open.mock.mockImplementation(register(() => {
      current = created
      return created
    }))

    pm.show(file)

    pm.wm.open.mock.mockImplementation(register(() => fakeWindow()))
    pm.show('/other.tpy')

    expect(pm.app.dispatch.mock.callCount()).to.equal(0)
    expect(pm.wm.open.mock.callCount()).to.equal(2)
  })

  it('creates projects in a new empty window', async () => {
    let path = resolve('/new.tropy')

    pm.wm.open.mock.mockImplementation(register((type, props) => {
      let win = fakeWindow()
      expect(props.file).to.be.undefined
      setImmediate(() => opened(win, path))
      return win
    }))

    let { win } = await pm.open(path, { create: { name: 'New' } })
    let [action, target] = pm.app.dispatch.mock.calls[0].arguments

    expect(target).to.equal(win)
    expect(action).to.deep.include({
      payload: path,
      meta: { create: { name: 'New' } }
    })
  })

  it('rejects a create when its new window closes', async () => {
    let win = fakeWindow()
    pm.wm.open.mock.mockImplementation(register(() => win))

    let opening = pm.open('/new.tropy', { create: {} })
    // The window exists, but never becomes ready.
    await new Promise(setImmediate)
    pm.handleWindowClosed('project', win)

    let err = await opening.catch(e => e)
    expect(err).to.include({ code: 'ECANCELED' })
  })

  it('opens projects for a renderer in its window', () => {
    let win = fakeWindow()
    let path = resolve('/new.tropy')
    let create = { name: 'New' }
    wins.push(win)

    pm.handleOpenProject(win, { path, create })

    let [action, target] = pm.app.dispatch.mock.calls[0].arguments
    expect(target).to.equal(win)
    expect(action).to.deep.include({ payload: path, meta: { create } })
  })

  it('opens further projects for a renderer in new windows', () => {
    let win = fakeWindow()
    current = win
    wins.push(win)

    let path = resolve('/b.tpy')

    pm.handleOpenProject(win, { path: '/a.tpy' })
    pm.handleOpenProject(win, { path })

    expect(pm.app.dispatch.mock.calls[0].arguments[1]).to.equal(win)
    expect(pm.wm.open.mock.calls[0].arguments[1])
      .to.include({ file: path })
  })

  it('focuses a project open in another window instead', () => {
    let other = fakeWindow()
    opened(other, file)

    pm.handleOpenProject(fakeWindow(), { path: file })

    expect(other.show.mock.callCount()).to.equal(1)
    expect(pm.app.dispatch.mock.callCount()).to.equal(0)
  })

  it('passes meta like silent to new windows', async () => {
    let path = resolve('/a.tpy')

    pm.wm.open.mock.mockImplementation(register((type, props, opts) => {
      let win = fakeWindow()
      expect(props.file).to.be.undefined
      // The project's window, not a fixed size one without project.
      expect(opts.fixedSize).to.be.false
      setImmediate(() => opened(win, path))
      return win
    }))

    await pm.open(path, { silent: true })

    expect(pm.app.dispatch.mock.calls[0].arguments[0])
      .to.deep.include({ payload: path, meta: { silent: true } })
  })

  it('cancels opens and forgets the project when a window crashes', async () => {
    let win = fakeWindow()
    pm.wm.open.mock.mockImplementation(register(() => win))

    let opening = pm.open('/a.tpy')
    pm.handleWindowCrashed('project', win)

    let err = await opening.catch(e => e)
    expect(err).to.include({ code: 'ECANCELED' })

    opened(win, '/b.tpy')
    pm.handleWindowCrashed('project', win)
    expect(pm.get(win)).to.be.null
  })

  it('cancels opens when a window reloads', async () => {
    let win = fakeWindow()
    pm.wm.open.mock.mockImplementation(register(() => win))

    let opening = pm.open('/a.tpy')
    pm.handleWindowReload('project', win)

    let err = await opening.catch(e => e)
    expect(err).to.include({ code: 'ECANCELED' })
  })

  it('ignores updates of projects a window does not have open', () => {
    let win = fakeWindow()
    let update = (path) =>
      pm.handleProjectUpdated({ sender: win }, { path, name: 'New' })

    update('/a.tpy')
    expect(pm.get(win)).to.be.null

    opened(win, '/a.tpy')
    update('/b.tpy')
    expect(pm.get(win)).to.include({ path: '/a.tpy' })

    update('/a.tpy')
    expect(pm.get(win)).to.include({ path: '/a.tpy', name: 'New' })
  })

  it('finds no window without a path', () => {
    wins.push(fakeWindow())
    expect(pm.window(undefined)).to.be.null
  })

  it('opens projects requested by other windows elsewhere', () => {
    let prefs = fakeWindow()
    pm.handleOpenProject(prefs, { path: file })

    expect(pm.app.dispatch.mock.callCount()).to.equal(0)
    expect(pm.wm.open.mock.callCount()).to.equal(1)
  })

  it('closes only the prefs of the window opening a project', () => {
    let win = fakeWindow()
    let prefs = { close: mock.fn(), getParentWindow: () => win }
    pm.wm.first = () => prefs

    opened(fakeWindow(), '/a.tpy')
    expect(prefs.close.mock.callCount()).to.equal(0)

    opened(win, '/b.tpy')
    expect(prefs.close.mock.callCount()).to.equal(1)
  })

  it('reloads the project of closed prefs', () => {
    let win = fakeWindow()
    opened(win, file)

    pm.handleWindowClose('prefs', { getParentWindow: () => win })

    let [action, target] = pm.app.dispatch.mock.calls[0].arguments
    expect(action.name).to.equal('project.reload')
    expect(target).to.equal(win)
  })

  it('resolves unknown URL ids to null', async () => {
    expect(await pm.openByUrlId('unknown')).to.be.null
  })

  it('uses the active project window for the current project', async () => {
    current = fakeWindow()
    opened(current, file)

    expect(await pm.openByUrlId('current')).to.include({ win: current })
    expect(pm.wm.open.mock.callCount()).to.equal(0)
  })

  it('prefers open projects when finding URL ids', () => {
    let other = '/elsewhere/pm.test.js'
    opened(fakeWindow(), other)
    pm.app.state.recent = [file, other]

    expect(pm.find('pm.test')).to.equal(other)
  })

  it('lists only existing recent projects', () => {
    pm.app.state.recent = ['/missing.tpy', file]
    expect(pm.list().map(p => p.path)).to.eql([file])
  })

  it('falls back to the most recent project for the current project', () => {
    pm.app.state.recent = ['/missing.tpy', file]
    expect(pm.find('current')).to.equal(file)
  })

  it('tracks the project of each window', () => {
    let win = fakeWindow()
    opened(win, file)

    closed(win, '/other.tpy')
    expect(pm.get(win)).to.include({ path: file })

    closed(win, file)
    expect(pm.get(win)).to.be.null
  })

  it('moves the focused project to the front of the recent projects', () => {
    let a = fakeWindow()
    let b = fakeWindow()

    opened(a, '/a.tpy')
    opened(b, '/b.tpy')
    expect(pm.recent.slice(0, 2)).to.eql(['/b.tpy', '/a.tpy'])

    let reloads = pm.app.menu.reload.mock.callCount()
    pm.handleWindowFocus('project', a)

    expect(pm.recent.slice(0, 2)).to.eql(['/a.tpy', '/b.tpy'])
    expect(pm.app.menu.reload.mock.callCount()).to.equal(reloads)
  })

  it('updates the titles of project windows when the locale changes', () => {
    let win = fakeWindow()
    pm.app.dict = { window: { project: { readOnly: ' (read-only)' } } }
    opened(win, '/a.tpy')
    pm.handleProjectUpdated({ sender: win }, {
      path: '/a.tpy', name: 'A', isReadOnly: true
    })

    pm.app.dict = { window: { project: { readOnly: ' (schreibgeschützt)' } } }
    pm.handleLocaleChange()

    let [target, title] = pm.wm.setTitle.mock.calls.at(-1).arguments
    expect(target).to.equal(win)
    expect(title).to.equal('A (schreibgeschützt)')
  })

  it('opens new windows with the persistence id of their project', () => {
    pm.show(file)
    expect(pm.wm.open.mock.calls[0].arguments[2])
      .to.include({ persistence: 'pm.test' })
  })

  it('switches persistence ids with the project of a window', () => {
    let ids = () => pm.wm.setPersistenceId.mock.calls.map(c => c.arguments[1])
    let win = fakeWindow()

    opened(win, '/a.tpy')
    pm.handleProjectUpdated({ sender: win }, { path: '/a.tpy', name: 'A' })
    opened(win, '/b.tpy')
    closed(win, '/b.tpy')

    expect(ids()).to.eql(['a', 'b', null])
  })

  it('clears the persistence id of new windows that fail to open', async () => {
    let win = fakeWindow()
    let path = resolve('/a.tpy')

    pm.wm.open.mock.mockImplementation(register(() => {
      setImmediate(() => closed(win, path, { message: 'corrupt' }))
      return win
    }))

    await pm.open(path).catch(() => {})

    let [target, id] = pm.wm.setPersistenceId.mock.calls[0].arguments
    expect(target).to.equal(win)
    expect(id).to.be.null
  })

  it('prunes saved geometry to the recent projects', () => {
    opened(fakeWindow(), '/a.tpy')

    let [type, ids] = pm.wm.prune.mock.calls.at(-1).arguments
    expect(type).to.equal('project')
    expect(ids).to.include('a')
  })

  it('keeps open projects when clearing recent projects', () => {
    let win = fakeWindow()
    opened(win, '/b.tpy')

    pm.app.state.recent = ['/a.tpy', '/b.tpy', '/c.tpy']
    pm.clearRecent(['/a.tpy', '/b.tpy'])
    expect(pm.recent).to.eql(['/b.tpy', '/c.tpy'])

    pm.clearRecent()
    expect(pm.recent).to.eql(['/b.tpy'])
  })
})
