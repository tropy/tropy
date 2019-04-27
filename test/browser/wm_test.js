'use strict'

const { join } = require('path')
const { BrowserWindow } = require('electron')
const { once } = __require('common/util')

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

    for (let type of ['about', 'prefs', 'project', 'wizard']) {
      describe(`open('${type}')`, function () {
        this.timeout(12000)

        let win
        let ready

        before(async () => {
          win = await wm.open(type)
          ready = once(win, 'ready')
        })

        after(() => win = null)

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
