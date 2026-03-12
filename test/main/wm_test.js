import fs from 'node:fs'
import { once } from 'node:events'
import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { WindowManager } from '#internal/main/wm.js'
import { Plugins } from '#internal/common/plugins.js'


describe('WindowManager', () => {
  describe('instance', () => {
    let wm = new WindowManager({ preload: F.preload })
    let plugins = new Plugins(join(app.getPath('userData'), 'plugins'))

    before(() => plugins.init())
    before(() => wm.start())
    before(() => fs.promises.copyFile(
      F.db('ontology.db').path,
      join(app.getPath('userData'), 'ontology.db')))

    after(() => wm.stop(true))

    it('has no windows initially', () => {
      expect([...wm]).to.be.empty
    })

    // TODO open project window with and without project file

    for (let type of ['about', 'prefs', 'print', 'project']) {
      describe(`open('${type}')`, function () {
        // Integration tests with on-the-fly code instrumentation take some time!
        this.timeout(process.env.CI ? 40000 : 20000)

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

        // Run this test last!
        it('can be closed', async () => {
          await wm.close(type)
          expect(wm.has(type)).to.be.false
          expect(win.isDestroyed()).to.be.true
        })
      })
    }

    describe('unload lifecycle', function () {
      this.timeout(process.env.CI ? 40000 : 20000)

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

        // Start close, then try to close again immediately
        let closed = once(win, 'closed')
        win.close()
        win.close()
        await closed

        expect(wm.has('about')).to.be.false
        expect(win.isDestroyed()).to.be.true
      })
    })
  })
})
