import { app } from 'electron'
import { URL } from 'url'
import { Tropy } from '../../src/browser/tropy'

const fakeWindow = () => ({
  show: sinon.spy(),
  setTitle: sinon.spy(),
  webContents: {
    send: sinon.spy()
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
      beforeEach(() => {
        sinon.stub(tropy, 'showAboutWindow')
      })

      it('tropy://about shows the about window', async () => {
        await tropy.handleProtocolRequest(new URL('tropy://about'))
        expect(tropy.showAboutWindow).to.have.been.calledOnce
      })

      it('tropy://version shows the about window', async () => {
        await tropy.handleProtocolRequest(new URL('tropy://version'))
        expect(tropy.showAboutWindow).to.have.been.calledOnce
      })
    })

    describe('prefs', () => {
      beforeEach(() => {
        sinon.stub(tropy, 'showPreferencesWindow')
      })

      it('tropy://prefs shows the prefs window', async () => {
        await tropy.handleProtocolRequest(new URL('tropy://prefs'))
        expect(tropy.showPreferencesWindow).to.have.been.calledOnce
      })

      it('tropy://preferences shows the prefs window', async () => {
        await tropy.handleProtocolRequest(new URL('tropy://preferences'))
        expect(tropy.showPreferencesWindow).to.have.been.calledOnce
      })
    })

    describe('project', () => {
      beforeEach(() => {
        sinon.stub(tropy.wm, 'current')
        sinon.stub(tropy, 'openMostRecentProject').callsFake(fakeWindow)
        sinon.stub(tropy, 'dispatch')
      })

      it('tropy://project shows the project window', async () => {
        await tropy.handleProtocolRequest(new URL('tropy://project'))

        expect(tropy.openMostRecentProject).to.have.been.calledOnce
        expect(tropy.dispatch).not.to.have.been.called
      })

      it('tropy://project/current/items/41/3 opens item 41 in current project ',
        async () => {
          await tropy.handleProtocolRequest(new URL('tropy://project/current/items/41/3'))

          expect(tropy.dispatch).to.have.been.calledOnce
          expect(tropy.dispatch.args[0][0])
            .to.have.a.nested.property('payload.id', 41)
          expect(tropy.dispatch.args[0][0])
            .to.have.a.nested.property('payload.photos').eql([3])
        })
    })
  })

  describe('showProjectWindow', () => {
    let win
    let project = { path: 'x.tpy' }

    beforeEach(() => {
      win = fakeWindow()

      tropy.state = { recents: [], win: { bounds: {} } }
      tropy.setProject(project, win)

      sinon.stub(tropy.wm, 'map').returns([win])
      sinon.stub(tropy.wm, 'open')
    })

    afterEach(() => {
      tropy.setProject(null, win)

      tropy.wm.map.restore()
      tropy.wm.open.restore()
    })

    it('focus window if project already open', () => {
      tropy.showProjectWindow(project.path, null)

      expect(win.show).to.have.been.called
      expect(tropy.wm.open).not.to.have.been.called
    })

    it('new window if not already open', () => {
      tropy.showProjectWindow('other.tpy', null)

      expect(win.show).not.to.have.been.called
      expect(tropy.wm.open).to.have.been.calledOnce

      let call = tropy.wm.open.getCall(0)

      expect(call.args[0]).to.eql('project')
      expect(call.args[1]).to.have.property('file', 'other.tpy')
    })

    it('open in existing window if given', () => {
      tropy.showProjectWindow('other.tpy', win)

      expect(tropy.wm.open).not.to.have.been.called

      expect(win.show).to.have.been.called
      expect(win.webContents.send).to.have.been.calledOnce

      let [type, action] = win.webContents.send.getCall(0).args

      expect(type).to.eql('dispatch')
      expect(action.payload).to.eql('other.tpy')
    })
  })
})
