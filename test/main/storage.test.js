import assert from 'node:assert/strict'
import { rm } from 'node:fs/promises'
import { app } from 'electron'
import { Storage } from '#tropy/main/storage.js'

describe('Storage', () => {
  describe('given a storage folder', () => {
    const folder = new Storage(app.getPath('userData'))

    describe('save', () => {
      after(() => (
        rm(folder.expand('test-c.json'))
      ))

      it('saves object with given name', () => {
        expect(() =>
          folder.save.sync('test-c.json', { name: 'c' })
        ).not.to.throw()
      })
    })

    describe('load', () => {
      before(() => (
        folder.save('test-b.json', { name: 'b' })
      ))

      after(() => (
        rm(folder.expand('test-b.json'))
      ))

      it('opens and parses the given file', async () => {
        expect(await folder.load('test-b.json'))
          .to.have.property('name', 'b')
      })

      it('merges with defaults', async () => {
        expect(await folder.load('test-b.json', { v: 1 }))
          .to.eql({ v: 1, name: 'b' })
      })

      it('fails if file does not exist', async () => {
        await assert.rejects(() => folder.load('test-x.json'))
      })

      it('returns defaults if file does not exist', async () => {
        expect(await folder.load('test-x.json', { v: 1 }))
          .to.eql({ v: 1 })
      })
    })
  })
})
