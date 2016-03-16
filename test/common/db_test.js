'use strict'

const tmpdir = require('../support/tmpdir')

const { join } = require('path')
const { unlinkAsync: rm } = require('fs')
const { using } = require('bluebird')

describe('Database', () => {
  const { Database, Connection } = __require('common/db')

  describe('given a database file', () => {
    let db
    const dbFile = join(tmpdir, 'db_test.sqlite')

    before(() => {
      db = new Database(dbFile)
    })

    after(() =>
      db.close().then(() => rm(dbFile)))

    describe('constructor', () => {
      it('creates a connection pool', () => {
        expect(db.pool.getPoolSize()).to.be.at.least(1)
      })
    })


    describe('#acquire()', () => {
      it('returns a disposable connection', () => (
        using(db.acquire(), c => {
          expect(c).to.be.instanceof(Connection)
        })
      ))

      it('draws from the connection pool', () => {
        let count = db.pool.availableObjectsCount()

        return using(db.acquire(), c1 => {
          expect(db.pool.availableObjectsCount()).to.be.below(count)

          return using(db.acquire(), c2 => {
            expect(db.pool.getPoolSize()).to.be.at.least(2)
            expect(c1).not.to.equal(c2)
          })
        })
      })
    })

    describe('#exec()', () => {
    })

    describe('#transaction()', () => {
    })
  })
})
