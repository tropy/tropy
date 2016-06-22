'use strict'

const fs = require('fs')

describe('Storage', () => {
  const Storage = __require('browser/storage')

  describe('given a storage folder', () => {
    const folder = new Storage()

    describe('#save', () => {
      after(done => {
        fs.unlink(folder.expand('test-a.json'), done)
      })

      it('saves object with given name', () => (
        expect(folder.save('test-a.json', { name: 'a' }))
          .eventually.to.be.fulfilled
      ))
    })

    describe.skip('#save.sync', () => {
      after(done => {
        fs.unlink(folder.expand('test-a.json'), done)
      })

      it('saves object with given name', () => (
        expect(folder.save.sync('test-a.json', { name: 'a' })).not.to.throw
      ))
    })

    describe('#load', () => {
      before(() => (
        folder.save('test-b.json', { name: 'b' })
      ))

      after(done => {
        fs.unlink(folder.expand('test-b.json'), done)
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
