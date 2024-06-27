import { rm } from 'node:fs/promises'
import { app } from 'electron'
import { Storage } from '../../src/main/storage.js'

describe('Storage', () => {
  describe('given a storage folder', () => {
    const folder = new Storage(app.getPath('userData'))

    describe('#save', () => {
      after(() => (
        rm(folder.expand('test-a.json'))
      ))

      it('saves object with given name', () => (
        expect(folder.save('test-a.json', { name: 'a' }))
          .eventually.to.be.fulfilled
      ))
    })

    describe('#save.sync', () => {
      after(() => (
        rm(folder.expand('test-c.json'))
      ))

      it('saves object with given name', () => {
        expect(() =>
          folder.save.sync('test-c.json', { name: 'c' })
        ).not.to.throw()
      })
    })

    describe('#load', () => {
      before(() => (
        folder.save('test-b.json', { name: 'b' })
      ))

      after(() => (
        rm(folder.expand('test-b.json'))
      ))

      it('opens and parses the given file', () => (
        expect(folder.load('test-b.json'))
          .to.eventually.have.property('name', 'b')
      ))

      it('fails if file does not exist', () => (
        expect(folder.load('test-c.json'))
          .to.eventually.be.rejected
      ))
    })
  })
})
