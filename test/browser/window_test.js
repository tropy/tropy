'use strict'

const { BrowserWindow } = require('electron')

describe('window', () => {
  const window = __require('browser/window')

  describe('.open', () => {
    let win

    function open(...args) { return win = window.open(...args) }

    beforeEach(() =>
        sinon.spy(BrowserWindow.prototype, 'loadURL'))
    afterEach(() =>
        BrowserWindow.prototype.loadURL.restore())
    afterEach(() =>
        win && win.destroy())

    it('returns a BrowserWindow', () => {
      expect(open('index')).to.be.instanceof(BrowserWindow)
    })

    it('loads static page', () => {
      open('index')

      expect(win.loadURL)
        .to.have.been.calledWithMatch(/static.index\.html/)
    })

    it('loads url with encoded data', () => {
      open('index', { foo: 'bar' })
      expect(win.loadURL)
        .to.have.been.calledWithMatch('#%7B%22foo%22%3A%22bar%22%7D')
    })
  })
})
