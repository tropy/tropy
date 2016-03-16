'use strict'

const tmpdir = require('../support/tmpdir')

const { join } = require('path')
const { unlinkAsync: rm } = require('fs')

describe('Database', () => {
  const { Database } = __require('common/db')

  describe('given a database file', () => {
    let db
    const dbFile = join(tmpdir, 'db_test.sqlite')

    before(() => {
      db = new Database(dbFile)
    })

    after(() =>
      db.close().then(() => rm(dbFile))
    )

    describe('constructor', () => {
      it('creates a connection pool', () => {
        expect(db).to.have.property('pool')
        expect(db.pool.getPoolSize()).to.be.at.least(1)
      })
    })
  })
})
