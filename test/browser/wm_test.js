import fs from 'fs'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import { WindowManager } from '../../src/browser/wm'
import { View } from '../../src/common/res'
import { Plugins } from '../../src/common/plugins'

describe('WindowManager', () => {
  describe('instance', () => {
    let wm = new WindowManager({
      preload: join(__dirname, '..', 'support', 'bootstrap.js')
    })

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

    for (let type of ['about', 'prefs', 'print', 'project', 'wizard']) {
      describe(`open('${type}')`, function () {
        // Integration tests with on-the-fly code instrumentation take some time!
        this.timeout(process.env.CI ? 40000 : 20000)

        let win

        before(async () => {
          if (process.env.COVERAGE) {
            sinon
              .stub(View, 'expand')
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
            View.expand.restore()
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
