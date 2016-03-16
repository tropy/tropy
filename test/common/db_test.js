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
        expect(db.size).to.be.at.least(1)
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
        let count = db.ready

        return using(db.acquire(), c1 => {
          expect(db.ready).to.be.below(count)

          return using(db.acquire(), c2 => {
            expect(db.size).to.be.at.least(2)
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
        expect(
          db.exec('SELECT * FROM sqlite_master;')
        ).to.eventually.be.fulfilled
      ))

      it('rejects on error', () => (
        expect(
          db.exec('SELECT foobar FROM sqlite_master;')
        ).to.eventually.be.rejected
      ))

      it('acquires connection for every call', () => {
        expect(db.busy).to.eql(0)
        db.exec('SELECT * FROM sqlite_master;')
        expect(db.busy).to.eql(1)
        db.exec('SELECT * FROM sqlite_master;')
        expect(db.busy).to.eql(2)
      })

      it('re-uses connections if possible', () => (
        expect((async function () {
          expect(db.busy).to.eql(0)
          await db.exec('CREATE TABLE exec (a);')
          expect(db.busy).to.eql(0)
          await db.exec('DROP TABLE exec;')
          expect(db.busy).to.eql(0)
        })()).to.eventually.be.fulfilled
      ))

      it('ignores comments', () => (
        expect(db.exec(
          `-- A comment
          SELECT * FROM sqlite_master; -- Another comment`
        )).to.eventually.be.fulfilled
      ))
    })

    describe('#seq()', () => {
      it('exposes a connection', () => (
        expect(db.seq(c => {
          expect(db.busy).to.eql(1)
          c.run('SELECT * FROM sqlite_master')
          c.run('SELECT * FROM sqlite_master')
          expect(db.busy).to.eql(1)
        })).to.eventually.be.fulfilled
      ))

      it('rejects on error', () => (
        expect(db.seq(() => { throw 'error' })).to.eventually.be.rejected
      ))
    })

    describe('#transaction()', () => {
      //it('commits on success', () => (
      //  expect(db.transaction(async function (t) {
      //    await t.exec('CREATE TABLE t1 (a,b DEFAULT current_timestamp);')

      //    t.exec('INSERT INTO t1 (a) VALUES (1);')
      //    t.exec('INSERT INTO t1 (a) VALUES (2);')

      //    await t.exec('DROP TABLE t1;')

      //  })).to.eventually.be.fulfilled
      //))

      //it('rolls back on error', () => (
      //  expect(db.transaction(async function (t) {
      //    throw 'something'
      //  })).to.eventually.be.rejected
      //))
    })
  })
})
