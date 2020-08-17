'use strict'

const { join } = require('path')
const { copyFile } = require('fs').promises
const { app, BrowserWindow } = require('electron')
const res = __require('common/res')

describe('WindowManager', () => {
  const { WindowManager } = __require('browser/wm')
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
    before(() => copyFile(
      F.db('ontology.db').path,
      join(app.getPath('userData'), 'ontology.db')))

    after(() => wm.stop(true))

    it('has no windows initially', () => {
      expect([...wm]).to.be.empty
    })

    for (let type of ['about', 'prefs', 'print', 'project', 'wizard']) {
      describe(`open('${type}')`, function () {
        // Integration tests with on-the-fly code instrumentation take some time!
        this.timeout(process.env.CI ? 40000 : 20000)

        let win

        before(async () => {
          if (process.env.COVERAGE) {
            sinon
              .stub(res.View, 'expand')
              .callsFake(name => F.views(`${name}.html`).path)
          }

          win = await wm.open(type, {
            plugins: plugins.root,
            log: join(app.getPath('userData'), `wm-test-${type}.log`),
            data: app.getPath('userData')
          })
        })

        after(() => {
          if (process.env.COVERAGE) {
            res.View.expand.restore()
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
  })
})
