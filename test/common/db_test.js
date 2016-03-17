'use strict'

__require('common/promisify')

const tmpdir = require('../support/tmpdir')

const { join } = require('path')
const { unlinkAsync: rm } = require('fs')
const { all, map, using } = require('bluebird')
const { times } = __require('common/util')

describe('Database', () => {
  const { Database, Connection, Statement } = __require('common/db')

  describe('given a database file', () => {
    let db
    const dbFile = join(tmpdir, 'db_test.sqlite')

    before(() => {
      db = new Database(dbFile)

      sinon.spy(db.pool, 'acquire')
      sinon.spy(db.pool, 'release')
    })

    after(() =>
      db.close().then(() => rm(dbFile)))

    afterEach(() => {
      db.pool.acquire.reset()
      db.pool.release.reset()
    })

    describe('constructor', () => {
      it('creates an empty connection pool', () => {
        expect(db.size).to.be.zero
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
          using(db.acquire(), () => { throw new Error() })
        ).to.eventually.be.rejected
      ))

      it('releases on error', () =>
        using(db.acquire(), () => { throw new Error() })
          .catch(() => expect(db.pool.release).to.have.been.called))
    })

    describe('#prepare()', () => {
      it('returns disposable statement and connection', () => (
        expect(
          db.prepare('SELECT * FROM sqlite_master', (stmt, conn) => {
            expect(stmt).to.be.instanceof(Statement)
            expect(conn).to.be.instanceof(Connection)
          })
        ).eventually.to.be.fulfilled
      ))

      it('finalizes statement when done', () => {
        sinon.spy(Statement.prototype, 'finalize')

        return expect(
          db
            .prepare('SELECT * FROM sqlite_master', () => {})
            .tap(() => {
              expect(Statement.prototype.finalize).to.have.been.called
            })
            .finally(() => { Statement.prototype.finalize.restore() })

        ).eventually.to.be.fulfilled
      })
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
      it('exposes a connection', () =>
        expect(db.seq(conn => {
          let ps = []

          expect(db.busy).to.eql(1)
          ps.push(conn.run('SELECT * FROM sqlite_master'))
          ps.push(conn.run('SELECT * FROM sqlite_master'))
          expect(db.busy).to.eql(1)

          return all(ps)
        })).to.eventually.be.fulfilled)

      it('rejects on error', () =>
        expect(db.seq(() => { throw new Error() })).to.eventually.be.rejected)

      it('does not roll back on error', () => (
        expect(
          db.seq(async function (c) {
            await c.run('CREATE TABLE s1 (a)')
            await c.run('XNSERT INTO s1 (a) VALUES (1)')

          })
            .catch(() => db.run('INSERT INTO s1 (a) VALUES (2)'))
            .finally(() => db.run('DROP TABLE s1'))

        ).to.eventually.be.fulfilled
      ))
    })

    describe('#transaction()', () => {
      it('rejects on error', () => (
        expect(
          db.transaction(() => { throw new Error() })
        ).to.eventually.be.rejected
      ))

      it('rolls back on error', () => (
        expect(
          db.transaction(async function (tx) {
            await tx.run('CREATE TABLE t1 (a)')
            await tx.run('XNSERT INTO t1 (a) VALUES (1)')

          })
            .catch(() => db.run('INSERT INTO t1 (a) VALUES (2)'))

        ).to.eventually.be.rejected
      ))

      it('commits on success', () => (
        expect(
          db.transaction(async function (tx) {
            await tx.run('CREATE TABLE t1 (a)')
            await tx.run('INSERT INTO t1 (a) VALUES (42)')

            await expect(db.get('SELECT a FROM t1'))
              .to.eventually.be.rejected

          }).then(() => db.get('SELECT a FROM t1'))

        ).to.eventually.be.fulfilled
          .and.have.property('a', 42)
      ))
    })

    describe('concurrency', () => {
      beforeEach(() =>
        db.run('CREATE TABLE cc (a)'))

      beforeEach(() =>
        db.prepare('INSERT INTO cc VALUES (?)', (stmt) =>
          times(9, i => stmt.run(i))))

      afterEach(() =>
        db.run('DROP TABLE cc'))

      describe('on multiple connections', () => {

        function count() {
          return db.get('SELECT COUNT(*) AS count FROM cc')
        }

        //function write(...args) {
        //  db.run('INSERT INTO cc VALUES (?)', ...args)
        //}

        it('supports parallel reading', () =>
          expect(
            map([count(), count(), count(), count()], r => r.count)
          ).to.eventually.eql([9, 9, 9, 9]))

        //it('supports parallel writing', () =>
        //  expect(
        //    map([write('w1'), write('w2'), write('w3'), write('w4')], x => x)
        //      .then(count)
        //  ).to.eventually.have.property('count', 13))

      })
    })
  })
})
