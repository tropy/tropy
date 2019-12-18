'use strict'

const { join } = require('path')
const { app, BrowserWindow } = require('electron')
const { once } = __require('common/util')
const res = __require('common/res')

describe('WindowManager', () => {
  const WindowManager = __require('browser/wm')
  const { Plugins } = __require('common/plugins')

  describe('instance', () => {
    let wm = new WindowManager({
      webPreferences: {
        preload: join(__dirname, '..', 'support', 'bootstrap.js')
      }
    })

    let plugins = new Plugins(join(app.getPath('userData'), 'plugins'))

    before(() => plugins.init())
    before(() => wm.start())
    after(() => wm.stop())

    it('has no windows initially', () => {
      expect([...wm]).to.be.empty
    })

    for (let type of ['about', 'prefs', 'print', 'project', 'wizard']) {
      describe(`open('${type}')`, function () {
        this.timeout(process.env.CI ? 20000 : 10000)

        let win
        let ready

        before(async () => {
          if (process.env.COVERAGE) {
            sinon
              .stub(res.view, 'expand')
              .callsFake(name => F.views(`${name}.html`).path)
          }

          win = await wm.open(type, {
            plugins: plugins.root,
            data: app.getPath('userData')
          })
          ready = once(win, 'ready')
        })

        after(() => {
          if (process.env.COVERAGE) {
            res.view.expand.restore()
          }

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

        it('reports "ready"', () =>
          expect(ready).to.eventually.be.fulfilled)

        // Run this test last!
        it('can be closed', async () => {
          await wm.close(type)
          expect(wm.has(type)).to.be.false
          expect(win.isDestroyed()).to.be.true
        })
      })
    }
  })
})
