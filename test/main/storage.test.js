import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { access, readFile, rm } from 'node:fs/promises'
import { app, safeStorage } from 'electron'
import { Storage } from '#tropy/main/storage.js'

describe('Storage', () => {
  const defaults = { v: 1 }

  describe('given a storage folder', () => {
    const folder = new Storage(app.getPath('userData'))

    describe('save', () => {
      after(() => (
        rm(folder.expand('test-c.json'))
      ))

      it('saves object with given name', () => {
        folder.save('test-c.json', { name: 'c' })
      })
    })

    describe('load', () => {
      before(() => {
        folder.save('test-b.json', { name: 'b' })
      })

      after(() => (
        rm(folder.expand('test-b.json'))
      ))

      it('opens and parses the given file', async () => {
        expect(await folder.load('test-b.json'))
          .to.have.property('name', 'b')
      })

      it('merges with defaults', async () => {
        expect(await folder.load('test-b.json', { defaults }))
          .to.eql({ v: 1, name: 'b' })
      })

      it('fails if file does not exist', async () => {
        await assert.rejects(() => folder.load('test-x.json'))
      })

      it('returns defaults if file does not exist', async () => {
        expect(await folder.load('test-x.json', { defaults }))
          .to.eql({ v: 1 })
      })
    })

    describe('secure', () => {
      const name = 'test.json.enc'
      const skip = safeStorage.isEncryptionAvailable()
        ? false
        : 'safeStorage encryption required'

      afterEach(async () => {
        safeStorage.isEncryptionAvailable.mock?.restore()
        await rm(folder.expand(name), { force: true })
      })

      describe('save', () => {
        it('encrypts and writes when available', { skip }, async () => {
          folder.save(name, { token: 'abc' }, { secure: true })
          let bytes = await readFile(folder.expand(name))
          expect(bytes.toString('utf-8')).not.to.include('abc')
        })

        it('does not write when encryption is unavailable', async () => {
          mock.method(safeStorage, 'isEncryptionAvailable', () => false)
          folder.save(name, { token: 'abc' }, { secure: true })

          await assert.rejects(
            () => access(folder.expand(name)),
            { code: 'ENOENT' }
          )
        })
      })

      describe('load', () => {
        it('decrypts and merges with defaults', { skip }, async () => {
          folder.save(name, { token: 'xyz' }, { secure: true })

          expect(
            await folder.load(name, { defaults, secure: true })
          ).to.eql({ v: 1, token: 'xyz' })
        })

        it('returns defaults when encryption is unavailable', { skip }, async () => {
          folder.save(name, { token: 'xyz' }, { secure: true })
          mock.method(safeStorage, 'isEncryptionAvailable', () => false)

          expect(
            await folder.load(name, { defaults, secure: true })
          ).to.eql({ v: 1 })
        })
      })
    })
  })
})
