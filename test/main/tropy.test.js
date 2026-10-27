import { mock } from 'node:test'
import { app } from 'electron'
import { URL } from 'node:url'
import { Tropy } from '#tropy/main/tropy.js'

const fakeWindow = () => ({
  isDestroyed: () => false,
  show: mock.fn(),
  setTitle: mock.fn(),
  webContents: {
    send: mock.fn()
  }
})

describe('Tropy', () => {
  let tropy

  beforeEach(() => {
    delete Tropy.instance

    tropy = new Tropy({
      data: app.getPath('userData')
    })
  })

  afterEach(() => {
    delete Tropy.instance
  })

  it('is a singleton class', () => {
    expect(tropy).to.equal(Tropy.instance)
    expect(tropy).to.equal(new Tropy())
  })

  describe('handleProtocolRequest', () => {
    describe('about', () => {
      let showAboutWindow

      beforeEach(() => {
        showAboutWindow = mock.method(tropy, 'showAboutWindow', async () => {})
      })

      afterEach(() => {
        showAboutWindow.mock.restore()
      })

      it('tropy://about shows the about window', async () => {
        await tropy.handleProtocolRequest(new URL('tropy://about'))
        expect(showAboutWindow.mock.callCount()).to.equal(1)
      })

      it('tropy://version shows the about window', async () => {
        await tropy.handleProtocolRequest(new URL('tropy://version'))
        expect(showAboutWindow.mock.callCount()).to.equal(1)
      })
    })

    describe('prefs', () => {
      let showPreferencesWindow

      beforeEach(() => {
        showPreferencesWindow = mock.method(tropy, 'showPreferencesWindow', async () => {})
      })

      afterEach(() => {
        showPreferencesWindow.mock.restore()
      })

      it('tropy://prefs shows the prefs window', async () => {
        await tropy.handleProtocolRequest(new URL('tropy://prefs'))
        expect(showPreferencesWindow.mock.callCount()).to.equal(1)
      })

      it('tropy://preferences shows the prefs window', async () => {
        await tropy.handleProtocolRequest(new URL('tropy://preferences'))
        expect(showPreferencesWindow.mock.callCount()).to.equal(1)
      })
    })

    describe('project', () => {
      describe('with open window', () => {
        let current, openMostRecentProject, dispatch

        beforeEach(() => {
          current = mock.method(tropy.wm, 'current', fakeWindow)
          openMostRecentProject = mock.method(tropy, 'openMostRecentProject', () => {})
          dispatch = mock.method(tropy, 'dispatch', () => {})
        })

        afterEach(() => {
          current.mock.restore()
          openMostRecentProject.mock.restore()
          dispatch.mock.restore()
        })

        it('tropy://project shows the project window', async () => {
          await tropy.handleProtocolRequest(new URL('tropy://project'))

          expect(current.mock.callCount()).to.equal(1)
          expect(openMostRecentProject.mock.callCount()).to.equal(0)
          expect(dispatch.mock.callCount()).to.equal(0)
        })

        it('tropy://project/current/items/41/3 opens item', async () => {
          await tropy.handleProtocolRequest(
            new URL('tropy://project/current/items/41/3'))

          expect(dispatch.mock.callCount()).to.equal(1)
          let action = dispatch.mock.calls[0].arguments[0]
          expect(action).to.have.nested.property('payload.id', 41)
          expect(action).to.have.nested.property('payload.photo', 3)
        })
      })

      describe('without open window', () => {
        let current, openMostRecentProject, dispatch

        beforeEach(() => {
          current = mock.method(tropy.wm, 'current', () => null)
          openMostRecentProject = mock.method(tropy, 'openMostRecentProject',
            () => {
              setTimeout(() => { tropy.emit('project:opened') }, 250)
              return fakeWindow()
            })
          dispatch = mock.method(tropy, 'dispatch', () => {})
        })

        afterEach(() => {
          current.mock.restore()
          openMostRecentProject.mock.restore()
          dispatch.mock.restore()
        })

        it('tropy://project shows the project window', async () => {
          await tropy.handleProtocolRequest(new URL('tropy://project'))

          expect(current.mock.callCount()).to.equal(1)
          expect(openMostRecentProject.mock.callCount()).to.equal(1)
          expect(dispatch.mock.callCount()).to.equal(0)
        })
      })
    })
  })

  describe('showProjectWindow', () => {
    let win, mapMock, openMock
    let project = { path: 'x.tpy' }

    beforeEach(() => {
      win = fakeWindow()

      tropy.state = { recents: [], win: { bounds: {} } }
      tropy.setProject(project, win)

      mapMock = mock.method(tropy.wm, 'map', () => [win])
      openMock = mock.method(tropy.wm, 'open', () => {})
    })

    afterEach(() => {
      tropy.setProject(null, win)
      mapMock.mock.restore()
      openMock.mock.restore()
    })

    it('focus window if project already open', async () => {
      await tropy.showProjectWindow(project.path, null)

      expect(win.show.mock.callCount()).to.be.greaterThan(0)
      expect(openMock.mock.callCount()).to.equal(0)
    })

    it('new window if not already open', async () => {
      await tropy.showProjectWindow('other.tpy', null)

      expect(win.show.mock.callCount()).to.equal(0)
      expect(openMock.mock.callCount()).to.equal(1)

      let args = openMock.mock.calls[0].arguments
      expect(args[0]).to.equal('project')
      expect(args[1]).to.have.property('file', 'other.tpy')
    })

    it('new window gets the project persistence id', async () => {
      await tropy.showProjectWindow('/path/to/other.tpy', null)

      expect(openMock.mock.calls[0].arguments[2])
        .to.have.property('persistenceId', 'project:other')
    })

    it('new window gets the bundle id for its database file', async () => {
      await tropy.showProjectWindow('/path/to/Foo.tropy/project.tpy', null)

      expect(openMock.mock.calls[0].arguments[2])
        .to.have.property('persistenceId', 'project:Foo')
    })

    it('new window uses the legacy bounds for the first project', async () => {
      tropy.state.win = { bounds: { x: 10, y: 20, width: 800, height: 600 } }
      await tropy.showProjectWindow('other.tpy', null)

      expect(openMock.mock.calls[0].arguments[2])
        .to.include({ x: 10, y: 20, width: 800, height: 600 })
    })

    it('new window ignores the legacy bounds once a project is saved', async () => {
      tropy.state.win = {
        bounds: { x: 10, y: 20, width: 800, height: 600 },
        'project:x': { x: 30, y: 40, width: 900, height: 700 }
      }
      await tropy.showProjectWindow('other.tpy', null)

      expect(openMock.mock.calls[0].arguments[2]).to.not.have.any.keys(
        'x', 'y', 'width', 'height')
    })

    it('new window without project has no persistence id', async () => {
      tropy.state.recent = []
      await tropy.showProjectWindow(null, null)

      expect(openMock.mock.calls[0].arguments[2].persistenceId)
        .to.be.undefined
    })

    it('replaces the start screen', async () => {
      tropy.setProject(null, win)
      await tropy.showProjectWindow('other.tpy', null)

      expect(openMock.mock.callCount()).to.equal(0)
      expect(win.webContents.send.mock.calls[0].arguments[1].payload)
        .to.equal('other.tpy')
    })

    it('does not replace a closing start screen', async () => {
      tropy.setProject(null, win)
      tropy.wm.unloading.set(win, 'close')
      await tropy.showProjectWindow('other.tpy', null)
      tropy.wm.unloading.delete(win)

      expect(openMock.mock.callCount()).to.equal(1)
      expect(win.webContents.send.mock.callCount()).to.equal(0)
    })

    it('does not replace a start screen that is opening a project', async () => {
      tropy.setProject(null, win)
      tropy.wm.persistenceIds.set(win, 'project:x')
      await tropy.showProjectWindow('other.tpy', null)
      tropy.wm.persistenceIds.delete(win)

      expect(openMock.mock.callCount()).to.equal(1)
      expect(win.webContents.send.mock.callCount()).to.equal(0)
    })

    it('does not replace a start screen twice', async () => {
      let is = mock.method(tropy.wm, 'is', () => true)
      tropy.setProject(null, win)

      await tropy.showProjectWindow('/path/to/a.tpy', null)
      await tropy.showProjectWindow('/path/to/b.tpy', null)

      is.mock.restore()
      tropy.wm.persistenceIds.delete(win)

      expect(win.webContents.send.mock.callCount()).to.equal(1)
      expect(openMock.mock.callCount()).to.equal(1)
    })

    it('open in existing window if given', async () => {
      await tropy.showProjectWindow('other.tpy', win)

      expect(openMock.mock.callCount()).to.equal(0)
      expect(win.show.mock.callCount()).to.be.greaterThan(0)
      expect(win.webContents.send.mock.callCount()).to.equal(1)

      let [type, action] = win.webContents.send.mock.calls[0].arguments
      expect(type).to.equal('dispatch')
      expect(action.payload).to.equal('other.tpy')
    })
  })

  describe('persistence id', () => {
    let win, calls, mocks

    beforeEach(() => {
      win = fakeWindow()
      calls = []
      tropy.state = { recent: [], win: {} }

      mocks = [
        mock.method(tropy.wm, 'is', (w, type) =>
          w === win && type === 'project'),
        mock.method(tropy.wm, 'setPersistenceId', (...args) => {
          calls.push(['setPersistenceId', ...args])
        }),
        mock.method(tropy, 'dispatch', (...args) => {
          calls.push(['dispatch', ...args])
        })
      ]
    })

    afterEach(() => {
      for (let m of mocks) m.mock.restore()
    })

    it('is set before a project opens', () => {
      tropy.projectWillOpen('/path/to/x.tpy', win)
      expect(calls).to.eql([
        ['setPersistenceId', win, 'project:x', { restore: true }]
      ])
    })

    it('keeps the geometry when switching projects in place', () => {
      tropy.setProject({ path: '/path/to/y.tpy' }, win)
      tropy.projectWillOpen('/path/to/x.tpy', win)
      tropy.setProject(null, win)

      expect(calls).to.eql([
        ['setPersistenceId', win, 'project:x', { restore: false }]
      ])
    })

    it('is not set for other windows', () => {
      tropy.projectWillOpen('/path/to/x.tpy', fakeWindow())
      expect(calls).to.be.empty
    })

    it('is cleared before the project closes', () => {
      tropy.closeProject(win)

      expect(calls.map(c => c[0])).to.eql(['setPersistenceId', 'dispatch'])
      expect(calls[0]).to.eql(['setPersistenceId', win, null])
      expect(calls[1][1].payload).to.equal('user')
    })
  })

  describe('pruneProjectGeometry', () => {
    let bounds = { x: 10, y: 20, width: 800, height: 600 }

    beforeEach(() => {
      tropy.state = {
        recent: ['/a/x.tpy', '/b/y.tpy'],
        win: {
          bounds,
          'project:x': bounds,
          'project:y': bounds,
          'prefs': bounds
        }
      }

      tropy.wm.geometry = tropy.state.win
    })

    it('prunes projects removed from recent', () => {
      tropy.clearRecentProjects(['/b/y.tpy'])
      expect(tropy.wm.geometry).to.have.all.keys('bounds', 'project:x', 'prefs')
    })

    it('keeps geometry shared by a same-name project', () => {
      tropy.state.recent.push('/c/y.tpy')
      tropy.clearRecentProjects(['/b/y.tpy'])

      expect(tropy.wm.geometry).to.have.all.keys(
        'bounds', 'project:x', 'project:y', 'prefs')
    })

    it('prunes all projects when recent is cleared', () => {
      tropy.clearRecentProjects()
      expect(tropy.wm.geometry).to.have.all.keys('bounds', 'prefs')
    })
  })
})
