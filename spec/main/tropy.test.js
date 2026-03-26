import { mock } from 'node:test'
import { app } from 'electron'
import { URL } from 'node:url'
import { Tropy } from '#tropy/main/tropy.js'

const fakeWindow = () => ({
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
})
