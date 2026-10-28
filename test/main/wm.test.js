import fs from 'node:fs'
import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { EventEmitter, once } from 'node:events'
import { join } from 'node:path'
import { env } from 'node:process'
import { app, BrowserWindow } from 'electron'
import { WindowManager } from '#tropy/main/wm.js'
import { Plugins } from '#tropy/common/plugins.js'

// A minimal app: no environment, default settings.
const mkapp = () => Object.assign(new EventEmitter(), {
  env: {},
  opts: {},
  state: { theme: 'system', zoom: 1 }
})

describe('WindowManager', () => {
  describe('instance', () => {
    let wm = new WindowManager(mkapp())
    let plugins = new Plugins(join(app.getPath('userData'), 'plugins'))

    before(() => plugins.init())
    before(() => wm.start())
    before(() => fs.promises.copyFile(
      F.join('db/ontology.db'),
      join(app.getPath('userData'), 'ontology.db')))

    after(() => wm.stop(true))

    it('has no windows initially', () => {
      expect([...wm]).to.be.empty
    })

    for (let type of ['about', 'prefs', 'print', 'project']) {
      describe(`open('${type}')`, {
        timeout: env.CI ? 20000 : 2000
      }, () => {
        let win

        before(async () => {
          win = await wm.open(type, {
            plugins: plugins.root,
            log: join(app.getPath('userData'), `wm-test-${type}.log`),
            data: app.getPath('userData')
          })
        })

        after(() => {
          win = null
        })

        it('opens a browser window', () => {
          expect(win).to.be.instanceOf(BrowserWindow)
        })

        it('registers the window by type', () => {
          expect(wm.has(type)).to.be.true
          expect(wm.current(type)).to.equal(win)
          expect([...wm]).to.contain(win)
        })

        it('returns the window before it is ready', () => {
          let other = wm.open(type, {
            plugins: plugins.root,
            log: join(app.getPath('userData'), `wm-test-${type}.log`),
            data: app.getPath('userData')
          })

          expect(other).to.be.instanceOf(BrowserWindow)
          expect(wm.current(type)).to.equal(other)
          other.destroy()
        })

        it('becomes ready', async () => {
          await wm.ready(win)
          expect(wm.isReady(win)).to.be.true
        })

        it('queues actions until the window is ready', async () => {
          let other = wm.open(type, {
            plugins: plugins.root,
            log: join(app.getPath('userData'), `wm-test-${type}.log`),
            data: app.getPath('userData')
          })
          let send = mock.method(other.webContents, 'send')

          wm.dispatch(other, { type: 'a' })
          wm.dispatch(other, { type: 'b' })
          expect(wm.isReady(other)).to.be.false

          await wm.ready(other)

          expect(send.mock.calls
            .filter(c => c.arguments[0] === 'dispatch')
            .map(c => c.arguments[1].type)).to.eql(['a', 'b'])

          other.destroy()
        })

        it('dispatches to ready windows right away', async () => {
          await wm.ready(win)
          let send = mock.method(win.webContents, 'send', () => {})

          wm.dispatch(win, { type: 'test' })
          expect(send.mock.callCount()).to.equal(1)

          send.mock.restore()
        })

        it('can be closed', async () => {
          await wm.close(type)
          expect(wm.has(type)).to.be.false
          expect(win.isDestroyed()).to.be.true
        })
      })
    }

    describe('unload lifecycle', {
      timeout: env.CI ? 20000 : 2000
    }, () => {
      let openWindow = (type = 'about') =>
        wm.open(type, {
          plugins: plugins.root,
          log: join(app.getPath('userData'), `wm-test-unload-${type}.log`),
          data: app.getPath('userData')
        })

      it('cleans up unloading state after close', async () => {
        let win = await openWindow()
        await wm.ready(win)
        expect(wm.unloading.has(win)).to.be.false

        await wm.close('about')
        expect(wm.has('about')).to.be.false
        expect(win.isDestroyed()).to.be.true
      })

      it('handles concurrent close calls', async () => {
        let win = await openWindow()
        await wm.ready(win)

        await Promise.all([
          wm.close('about'),
          wm.close('about')
        ])

        expect(wm.has('about')).to.be.false
        expect(win.isDestroyed()).to.be.true
      })

      it('reloads and returns to idle state', async () => {
        let win = await openWindow()
        await wm.ready(win)

        let loaded = once(win.webContents, 'did-finish-load')
        wm.handleUnload(win, 'reload')
        await loaded

        expect(wm.has('about')).to.be.true
        expect(wm.unloading.has(win)).to.be.false
        expect(win.isDestroyed()).to.be.false

        await wm.close('about')
      })

      it('can close after reload', async () => {
        let win = await openWindow()
        await wm.ready(win)

        let loaded = once(win.webContents, 'did-finish-load')
        wm.handleUnload(win, 'reload')
        await loaded

        await wm.close('about')
        expect(wm.has('about')).to.be.false
        expect(win.isDestroyed()).to.be.true
      })

      it('ignores close during unload', async () => {
        let win = await openWindow()
        await wm.ready(win)

        let closed = once(win, 'closed')
        win.close()
        win.close()
        await closed

        expect(wm.has('about')).to.be.false
        expect(win.isDestroyed()).to.be.true
      })
    })
  })

  describe('handleShowDialog', () => {
    it('replies with an error for unknown dialog types', async () => {
      let { promise, resolve } = Promise.withResolvers()
      let win = { webContents: { send: mock.fn(resolve) } }

      new WindowManager(mkapp()).handleShowDialog(win, { id: 1, type: 'unknown' })

      await promise
      expect(win.webContents.send.mock.calls[0].arguments).to.eql([
        'dialog',
        {
          error: true,
          id: 1,
          payload: { message: 'unknown dialog type: unknown' }
        }
      ])
    })
  })

  describe('configure', () => {
    it('gives project windows without a project a fixed size', () => {
      let wm = new WindowManager(mkapp())
      let size = (args) => wm.configure('project', {}, args).fixedSize

      expect(size({})).to.include({ width: 440, height: 580 })
      expect(size({ recent: ['/a.tropy'] })).to.include({ width: 880 })
      expect(size({ file: '/a.tropy' })).to.be.undefined
    })
  })

  describe('args', () => {
    it('combines the app environment and appearance settings', () => {
      let app = mkapp()
      app.env = { data: '/data' }
      app.state.locale = 'de'

      let wm = new WindowManager(app)
      wm.zoom(1.5)

      expect(wm.args).to.include({ data: '/data', locale: 'de', zoom: 1.5 })
    })
  })

  describe('rsvp', () => {
    let wm = new WindowManager(mkapp())
    let win = { webContents: { send () {} } }
    let action = () => ({ type: 'test', meta: {} })

    it('resolves with the response', async () => {
      let res = wm.rsvp(win, action())
      let [id] = Object.keys(wm.pending)

      wm.handlePendingResponse({ meta: { rsvp: id }, payload: 42 })
      expect(await res).to.have.property('payload', 42)
    })

    it('rejects after the timeout', async () => {
      await assert.rejects(wm.rsvp(win, action(), { timeout: 10 }),
        /no response/)
      expect(wm.pending).to.be.empty
    })

    it('rejects when the window goes away', async () => {
      let other = { webContents: { send () {} } }
      let res = wm.rsvp(win, action(), { timeout: 0 })
      let unaffected = wm.rsvp(other, action(), { timeout: 10 })

      wm.cancel(win, 'closed')

      await assert.rejects(res, { message: 'window closed' })
      expect(Object.values(wm.pending).map(p => p.win)).to.eql([other])
      await assert.rejects(unaffected, /no response/)
    })

    it('rejects when the window unloads', async () => {
      let res = wm.rsvp(win, action(), { timeout: 0 })
      wm.handleUnloaded(win)

      await assert.rejects(res, { message: 'window unloaded' })
    })
  })
})
