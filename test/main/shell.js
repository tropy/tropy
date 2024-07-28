import { platform } from 'node:process'
import { shell } from 'electron'
import { open, show } from '#internal/main/shell.js'

describe('shell', () => {
  let desktop = platform === 'win32' ?
    'C:\\Users\\tropy/Desktop' : '/home/tropy/Desktop'
  let desktopUrl = platform === 'win32' ?
    'file:///C:/Users/tropy/Desktop' : 'file:///home/tropy/Desktop'
  let www = 'https://tropy.org'

  beforeEach(() => {
    sinon.stub(shell, 'openExternal')
    sinon.stub(shell, 'openPath')
    sinon.stub(shell, 'showItemInFolder')
  })

  afterEach(() => {
    shell.openExternal.restore()
    shell.openPath.restore()
    shell.showItemInFolder.restore()
  })

  describe('open', () => {
    it('calls openPath for local paths', async () => {
      await open(desktop)
      expect(shell.openExternal).not.to.have.been.called
      expect(shell.openPath).to.have.been.calledWith(desktop)
    })

    it('calls openPath for file URLs', async () => {
      await open(desktopUrl)
      expect(shell.openExternal).not.to.have.been.called
      expect(shell.openPath).to.have.been.calledWith(desktop)
    })

    it('calls openExternal for other URLs', async () => {
      await open(www)
      expect(shell.openPath).not.to.have.been.called
      expect(shell.openExternal).to.have.been.calledWith(www)
    })
  })

  describe('show', () => {
    it('calls showItemInFolder for local paths', async () => {
      await show(desktop)
      expect(shell.openExternal).not.to.have.been.called
      expect(shell.showItemInFolder).to.have.been.calledWith(desktop)
    })

    it('calls showItemInFolder for file URLs', async () => {
      await show(desktopUrl)
      expect(shell.openExternal).not.to.have.been.called
      expect(shell.showItemInFolder).to.have.been.calledWith(desktop)
    })

    it('calls openExternal for other URLs', async () => {
      await show(www)
      expect(shell.showItemInFolder).not.to.have.been.called
      expect(shell.openExternal).to.have.been.calledWith(www)
    })
  })
})
