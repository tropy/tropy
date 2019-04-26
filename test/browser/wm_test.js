'use strict'

const { join } = require('path')
const { BrowserWindow } = require('electron')

describe('WindowManager', () => {
  const WindowManager = __require('browser/wm')

  describe('instance', () => {
    let wm = new WindowManager({
      webPreferences: {
        preload: join(__dirname, '..', 'support', 'bootstrap.js')
      }
    })

    before(() => wm.start())
    after(() => wm.stop())

    it('has no windows initially', () => {
      expect([...wm]).to.be.empty
    })

    describe('window', () => {
      for (let type of ['about', 'prefs', 'project', 'wizard']) {
        describe(type, function () {
          this.timeout(10000)
          let win

          before(async () => {
            win = await wm.open(type, {}, { resolves: 'wm-ready' })
          })

          after(() => win = null)

          it('is opens a browser window', () => {
            expect(win).to.be.instanceOf(BrowserWindow)
          })

          it('registers the window by type', () => {
            expect(wm.has(type)).to.be.true
            expect(wm.current(type)).to.equal(win)
            expect([...wm]).to.contain(win)
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
})
