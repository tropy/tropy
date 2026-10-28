import fs from 'node:fs'
import { mock } from 'node:test'
import { once } from 'node:events'
import { join } from 'node:path'
import { setImmediate as tick } from 'node:timers/promises'
import { env, platform } from 'node:process'
import { app, BrowserWindow, screen } from 'electron'
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

    describe('restoreSize', {
      timeout: env.CI ? 20000 : 2000
    }, () => {
      let win
      let bounds = { x: 120, y: 140, width: 640, height: 480 }

      beforeEach(async () => {
        win = await wm.open('print', {
          plugins: plugins.root,
          log: join(app.getPath('userData'), 'wm-test-bounds.log'),
          data: app.getPath('userData')
        })
      })

      afterEach(() => wm.close('print'))

      it('applies the size and keeps the position', () => {
        let { x, y } = win.getBounds()
        wm.restoreSize(win, bounds)

        expect(win.getBounds()).to.eql({ x, y, width: 640, height: 480 })
      })

      it('defers the size while in fixed-size mode', async () => {
        await wm.setFixedSize(win, true, {
          width: 400,
          height: 300,
          animate: false
        })

        let { x, y } = win.getBounds()
        wm.restoreSize(win, bounds)
        expect(win.getContentSize()).to.eql([400, 300])

        await wm.setFixedSize(win, false, { animate: false })
        expect(win.getBounds()).to.eql({ x, y, width: 640, height: 480 })
      })

      it('keeps the pending size when restored in fixed-size mode', async () => {
        await wm.setFixedSize(win, true, {
          width: 400,
          height: 300,
          animate: false
        })

        let { x, y } = win.getBounds()
        wm.pendingBounds.set(win, bounds)
        win.emit('restore')
        await tick()
        expect(win.getContentSize()).to.eql([400, 300])

        await wm.setFixedSize(win, false, { animate: false })
        expect(win.getBounds()).to.eql({ x, y, width: 640, height: 480 })
      })
    })

    describe('persistence id', {
      timeout: env.CI ? 20000 : 2000
    }, () => {
      let a = { x: 100, y: 120, width: 600, height: 400 }
      let b = { x: 200, y: 220, width: 700, height: 500 }

      let openWindow = (opts) =>
        wm.open('print', {
          plugins: plugins.root,
          log: join(app.getPath('userData'), 'wm-test-persistence.log'),
          data: app.getPath('userData')
        }, opts)

      beforeEach(() => {
        wm.geometry = { 'test:a': a, 'test:b': b }
      })

      afterEach(() => wm.close('print'))

      it('opens the window with the saved geometry', async () => {
        let win = await openWindow({ persistenceId: 'test:a' })
        expect(win.getBounds()).to.eql(a)
      })

      it('saves and restores the geometry when the id changes', async () => {
        let win = await openWindow({ persistenceId: 'test:a' })
        win.setBounds(b)

        wm.setPersistenceId(win, 'test:c')
        expect(wm.geometry['test:a']).to.eql(b)

        win.setBounds(a)
        wm.setPersistenceId(win, 'test:b')
        expect(wm.geometry['test:c']).to.eql(a)
        expect(win.getBounds()).to.eql({ ...b, x: a.x, y: a.y })
      })

      it('keeps the geometry when asked not to restore', async () => {
        let win = await openWindow({ persistenceId: 'test:a' })

        wm.setPersistenceId(win, 'test:b', { restore: false })
        expect(win.getBounds()).to.eql(a)

        await wm.close('print')
        expect(wm.geometry['test:b']).to.eql(a)
      })

      it('saves the geometry when the window closes', async () => {
        let win = await openWindow({ persistenceId: 'test:a' })
        win.setBounds(b)

        await wm.close('print')
        expect(wm.geometry['test:a']).to.eql(b)
      })

      describe('when the saved position is off-screen', () => {
        let offscreen = { x: -20000, y: -20000, width: 600, height: 400 }

        let isOnScreen = ({ x, y, width, height }) =>
          screen.getAllDisplays().some(({ workArea: a }) =>
            x >= a.x && y >= a.y &&
            x + width <= a.x + a.width &&
            y + height <= a.y + a.height)

        it('opens the window on a connected display', async () => {
          wm.geometry['test:a'] = offscreen
          let win = await openWindow({ persistenceId: 'test:a' })

          expect(isOnScreen(win.getBounds())).to.be.true
        })

        it('fits a restored size onto the display', async () => {
          let win = await openWindow({ persistenceId: 'test:a' })

          wm.geometry['test:b'] = { ...offscreen, width: 50000, height: 50000 }
          wm.setPersistenceId(win, 'test:b')

          expect(isOnScreen(win.getBounds())).to.be.true
        })
      })

      it('saves nothing while in fixed-size mode', async () => {
        let win = await openWindow({ persistenceId: 'test:a' })

        await wm.setFixedSize(win, true, {
          width: 400,
          height: 300,
          animate: false
        })

        await wm.close('print')
        expect(wm.geometry['test:a']).to.eql(a)
      })

      // xvfb has no window manager to maximize windows
      describe('when the window is maximized', {
        skip: platform === 'linux' && env.CI ? 'needs a window manager' : false
      }, () => {
        let win

        beforeEach(async () => {
          win = await openWindow({ persistenceId: 'test:a' })

          let maximized = once(win, 'maximize')
          win.maximize()
          await maximized

          wm.setPersistenceId(win, 'test:b')
        })

        it('keeps the saved geometry of the new id', async () => {
          await wm.close('print')
          expect(wm.geometry['test:b']).to.eql(b)
        })

        it('restores the size once unmaximized', async () => {
          let unmaximized = once(win, 'unmaximize')
          win.unmaximize()
          await unmaximized
          await tick()

          expect(win.getBounds()).to.eql({ ...b, x: a.x, y: a.y })
        })
      })

      it('saves nothing without an id', async () => {
        let win = await openWindow()
        win.setBounds(b)

        await wm.close('print')
        expect(Object.keys(wm.geometry)).to.eql(['test:a', 'test:b'])
      })
    })

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
})
