'use strict'

describe('Window', () => {
  const Window = __require('browser/window')
  const { BrowserWindow } = require('electron')

  let win

  beforeEach(() => {
    win = new Window()
    win.webContents.removeAllListeners('dom-ready')
  })

  afterEach(() => {
    win.destroy()
  })

  it('extends BrowserWindow', () => {
    expect(new Window()).to.be.instanceof(BrowserWindow)
  })

  describe('#open', () => {
    beforeEach(() => sinon.spy(win, 'loadURL'))
    afterEach(() => win.loadURL.restore())

    it('loads static page', () => {
      win.open('index.html')
      expect(win.loadURL)
        .to.have.been.calledWithMatch('static/index.html')
    })

    it('loads url with encoded data', () => {
      win.open('index.html', { foo: 'bar' })
      expect(win.loadURL)
        .to.have.been.calledWithMatch('#%7B%22foo%22%3A%22bar%22%7D')
    })
  })
})
