'use strict'

const e = require('electron')
const app = (process.type === 'renderer' ? e.remote.app : e.app)
const fs = require('fs')

describe('Storage', () => {
  const Storage = __require('browser/storage')

  describe('given a storage folder', () => {
    let folder

    before(() => {
      folder = new Storage(app.getPath('temp'))
    })


    describe('#store', () => {
      it('saves object with given name', () => (
        expect(folder.store('test-a.json', { name: 'a' }))
          .eventually.to.be.fulfilled
      ))

      after(done => {
        fs.unlink(folder.expand('test-a.json'), done)
      })
    })

    describe('#load', () => {
      before(() => {
        folder.store('test-b.json', { name: 'b' })
      })

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
