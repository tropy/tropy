import { unlink as rm } from 'fs'
import { app } from 'electron'
import { Storage } from '../../src/browser/storage'

describe('Storage', () => {
  describe('given a storage folder', () => {
    const folder = new Storage(app.getPath('userData'))

    describe('#save', () => {
      after(done => {
        rm(folder.expand('test-a.json'), done)
      })

      it('saves object with given name', () => (
        expect(folder.save('test-a.json', { name: 'a' }))
          .eventually.to.be.fulfilled
      ))
    })

    describe('#save.sync', () => {
      after(done => {
        rm(folder.expand('test-c.json'), done)
      })

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

      after(done => {
        rm(folder.expand('test-b.json'), done)
      })

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
