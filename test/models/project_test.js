'use strict'

const { mkdbtmp } = require('../support/db')

describe('models', () => {
  const mod = __require('models')

  describe('project', () => {
    let db

    mkdbtmp(x => db = x,
      'a.tpy', mod.project.create, { name: 'Ariadne' })

    describe('create', () => {
      it('creates a fresh project', async () => {
        await expect(db.empty()).to.eventually.be.false

        await expect(db.all('select * from project'))
          .to.eventually.have.lengthOf(1)

        await expect(db.version())
          .to.eventually.to.be.a('number').above(1601010000)
      })
    })

    describe('load', () => {
      it('returns the project object', () =>
        expect(mod.project.load(db))
          .to.eventually.include({ name: 'Ariadne', items: 0 })
          .and.have.a.property('id').that.does.match(/^[\da-f-]+$/))
    })
  })
})
