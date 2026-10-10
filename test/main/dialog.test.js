import { mock } from 'node:test'
import assert from 'node:assert/strict'
import { dialog as electron } from 'electron'
import dialog from '#tropy/main/dialog.js'

describe('Dialog', () => {
  let stub = (name, result) =>
    mock.method(electron, name, async () => result)

  afterEach(() => {
    mock.restoreAll()
    dialog.lastDefaultPath = undefined
  })

  describe('show', () => {
    it('message-box', async () => {
      stub('showMessageBox', { response: 1, checkboxChecked: true })

      expect(await dialog.show('message-box', null, { cancelId: 0 }))
        .to.eql({ cancel: false, value: 1, data: { checked: true } })
      expect(await dialog.show('message-box', null, { cancelId: 1 }))
        .to.eql({ cancel: true, value: 1, data: { checked: true } })
    })

    it('message-box defaults cancelId to 0', async () => {
      stub('showMessageBox', { response: 0, checkboxChecked: false })

      expect(await dialog.show('message-box', null, {}))
        .to.eql({ cancel: true, value: 0, data: { checked: false } })
    })

    it('file', async () => {
      stub('showOpenDialog', { canceled: false, filePaths: ['/a/b', '/a/c'] })

      expect(await dialog.show('file', null, {}))
        .to.eql({ cancel: false, value: ['/a/b', '/a/c'], data: null })
      expect(dialog.lastDefaultPath).to.equal('/a')

      stub('showOpenDialog', { canceled: true, filePaths: [] })

      expect(await dialog.show('file', null, {}))
        .to.eql({ cancel: true, value: [], data: null })
    })

    it('save', async () => {
      stub('showSaveDialog', { canceled: false, filePath: '/x/y' })

      expect(await dialog.show('save', null, {}))
        .to.eql({ cancel: false, value: '/x/y', data: null })
      expect(dialog.lastDefaultPath).to.equal('/x')

      stub('showSaveDialog', { canceled: true, filePath: '' })

      expect(await dialog.show('save', null, {}))
        .to.eql({ cancel: true, value: null, data: null })
    })

    it('rejects unknown types', async () => {
      await assert.rejects(dialog.show('unknown', null, {}), {
        message: 'unknown dialog type: unknown'
      })
    })
  })
})
