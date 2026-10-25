import fs from 'node:fs'
import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { once } from 'node:events'
import { join } from 'node:path'
import { env } from 'node:process'
import { app, BrowserWindow } from 'electron'
import { WindowManager } from '#tropy/main/wm.js'
import { Plugins } from '#tropy/common/plugins.js'

describe('WindowManager', () => {
  describe('instance', () => {
    let wm = new WindowManager()
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

        it('resolves "ready" promise', async () => {
          expect(await win.ready).to.be.a('number')
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
        await win.ready
        expect(wm.unloading.has(win)).to.be.false

        await wm.close('about')
        expect(wm.has('about')).to.be.false
        expect(win.isDestroyed()).to.be.true
      })

      it('handles concurrent close calls', async () => {
        let win = await openWindow()
        await win.ready

        await Promise.all([
          wm.close('about'),
          wm.close('about')
        ])

        expect(wm.has('about')).to.be.false
        expect(win.isDestroyed()).to.be.true
      })

      it('reloads and returns to idle state', async () => {
        let win = await openWindow()
        await win.ready

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
        await win.ready

        let loaded = once(win.webContents, 'did-finish-load')
        wm.handleUnload(win, 'reload')
        await loaded

        await wm.close('about')
        expect(wm.has('about')).to.be.false
        expect(win.isDestroyed()).to.be.true
      })

      it('ignores close during unload', async () => {
        let win = await openWindow()
        await win.ready

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

      new WindowManager().handleShowDialog(win, { id: 1, type: 'unknown' })

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

  describe('rsvp', () => {
    let wm = new WindowManager()
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
