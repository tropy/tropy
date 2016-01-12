'use strict'

describe('Window', () => {
  const Window = __require('browser/window')
  const { BrowserWindow } = require('electron')

  it('extends BrowserWindow', () => {
    expect(new Window()).to.be.instanceof(BrowserWindow)
  })
})
