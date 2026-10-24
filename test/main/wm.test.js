import fs from 'node:fs'
import { mock } from 'node:test'
import { once } from 'node:events'
import { join } from 'node:path'
import { env } from 'node:process'
import { setImmediate } from 'node:timers/promises'
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

    for (let type of ['about', 'prefs', 'print', 'project', 'quicklook']) {
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

    describe('quicklook', {
      timeout: env.CI ? 20000 : 4000
    }, () => {
      let parent
      let other
      let quicklook

      let size = { width: 400, height: 300 }

      let openProject = () =>
        wm.open('project', {
          plugins: plugins.root,
          log: join(app.getPath('userData'), 'wm-test-ql.log'),
          data: app.getPath('userData')
        })

      let spy = (win) =>
        mock.method(win.webContents, 'send')

      let states = (send) => send.mock.calls
        .map(({ arguments: [channel, message] }) =>
          (channel === 'quicklook' && message.type === 'state') ?
            message.isVisible :
            null)
        .filter(isVisible => isVisible != null)

      before(async () => {
        [parent, other] = await Promise.all([openProject(), openProject()])
        quicklook = wm.first('quicklook')
        await quicklook.ready

        // Never actually show the window.
        quicklook.showInactive = () => {}
      })

      afterEach(() => {
        mock.restoreAll()
      })

      it('opens a single quicklook with project windows', () => {
        expect(quicklook).to.be.instanceOf(BrowserWindow)
        expect([...wm.values('quicklook')]).to.have.length(1)
      })

      it('does not show without content', async () => {
        await wm.quicklook.show(parent)
        expect(wm.quicklook.parent).to.be.null
      })

      it('shows quicklook as child of the sender', async () => {
        await wm.quicklook.resize(parent, size)

        let send = spy(parent)
        await wm.quicklook.show(parent)

        expect(wm.quicklook.parent).to.equal(parent)
        expect(quicklook.getParentWindow()).to.equal(parent)
        expect(states(send)).to.eql([true])
      })

      it('hides and detaches quicklook', async () => {
        let send = spy(parent)
        await wm.quicklook.hide(parent)

        expect(wm.quicklook.parent).to.be.null
        expect(quicklook.getParentWindow()).to.be.null
        expect(states(send)).to.eql([false])
      })

      it('hides when the content is gone', async () => {
        await wm.quicklook.show(parent)

        let send = spy(parent)
        await wm.quicklook.resize(parent, null)

        expect(wm.quicklook.parent).to.be.null
        expect(states(send)).to.eql([false])

        await wm.quicklook.resize(parent, size)
      })

      it('follows the active project window', async () => {
        await wm.quicklook.resize(other, size)
        await wm.quicklook.show(other)

        let send = spy(parent)
        let sendOther = spy(other)
        await wm.quicklook.follow(parent)

        expect(wm.quicklook.parent).to.equal(parent)
        expect(states(send)).to.eql([true])
        expect(states(sendOther)).to.eql([false])
      })

      it('hides instead of closing while project windows are open', async () => {
        await wm.quicklook.show(parent)

        let send = spy(parent)
        quicklook.close()
        await setImmediate()

        expect(quicklook.isDestroyed()).to.be.false
        expect(wm.quicklook.parent).to.be.null
        expect(states(send)).to.eql([false])
      })

      it('closes quicklook with last project window', async () => {
        let closed = once(quicklook, 'closed')

        await wm.close('project')
        await closed
        expect(wm.has('quicklook')).to.be.false
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
