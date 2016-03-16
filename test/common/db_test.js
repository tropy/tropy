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

    beforeEach(() => {
      sinon.spy(db.pool, 'acquire')
      sinon.spy(db.pool, 'release')
    })

    afterEach(() => {
      db.pool.acquire.restore()
      db.pool.release.restore()
    })

    describe('constructor', () => {
      it('creates a connection pool', () => {
        expect(db.pool.getPoolSize()).to.be.at.least(1)
      })
    })


    describe('#acquire()', () => {
      it('returns a disposable connection', () => (
        using(db.acquire(), c => {
          expect(db.pool.acquire).to.have.been.called
          expect(db.pool.release).not.to.have.been.called

          expect(c).to.be.instanceof(Connection)
        })
          .then(() => {
            expect(db.pool.release).to.have.been.called
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

      it('rejects on error', () => (
        expect(
          using(db.acquire(), () => { throw 'error' })
        ).to.eventually.be.rejected
      ))

      it('releases on error', () => (
        using(db.acquire(), () => { throw 'error' })
          .catch(() => expect(db.pool.release).to.have.been.called)
      ))
    })

    describe('#exec()', () => {
      it('executes arbitrary sql', () => (
        expect((async function () {
          await db.exec('CREATE TABLE exec (a);')
          await db.exec('DROP TABLE exec;')
        })()).to.eventually.be.fulfilled
      ))
    })

    describe('#transaction()', () => {
    })
  })
})
