import { mock } from 'node:test'
import { app } from 'electron'
import { URL } from 'node:url'
import { Tropy } from '#tropy/main/tropy.js'

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
      it('tropy://project/:id/items/41/3 opens the project and item', async () => {
        let win = { show: mock.fn() }
        let openById = mock.method(tropy.projects, 'openById', async () => win)
        let dispatch = mock.method(tropy, 'dispatch', () => {})

        await tropy.handleProtocolRequest(
          new URL('tropy://project/My%20Project/items/41/3'))

        expect(openById.mock.calls[0].arguments[0]).to.equal('My Project')
        expect(dispatch.mock.calls[0].arguments[1]).to.equal(win)
        expect(dispatch.mock.calls[0].arguments[0])
          .to.deep.include({ payload: { id: 41, photo: 3 } })

        openById.mock.restore()
        dispatch.mock.restore()
      })
    })
  })
})
