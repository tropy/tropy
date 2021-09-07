import { app } from 'electron'
import { URL } from 'url'
import { Tropy } from '../../src/browser/tropy'

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
        sinon.stub(tropy, 'openMostRecentProject').callsFake(() => ({
          show: sinon.spy()
        }))
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
})
