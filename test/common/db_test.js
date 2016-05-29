'use strict'

__require('common/promisify')

const tmpdir = require('../support/tmpdir')
const sh = require('shelljs')

const { join } = require('path')
const { all, map, using } = require('bluebird')
const { times } = __require('common/util')
const { Database, Connection, Statement } = __require('common/db')

function failure() { throw new Error() }

function rm(file, retry = 0) {
  try {
    sh.rm('-f', file)

  } catch (error) {
    if (process.platform === 'win32' && error.code === 'EBUSY' && retry > 0) {
      return rm(file, --retry)
    }

    throw error
  }
}

describe('Database', () => {
  describe('given a database file', () => {
    let db
    const dbFile = join(tmpdir, 'db_test.sqlite')

    beforeEach(() => {
      db = new Database(dbFile)

      sinon.spy(db.pool, 'acquire')
      sinon.spy(db.pool, 'release')
    })

    afterEach(() =>
      db.close()
        .then(() => rm(dbFile, 1000)))

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

      it('draws from the connection pool', () =>
        using(db.acquire(), c1 => {
          expect(db.size).to.be.at.least(1)

          if (db.max > 1) {
            return using(db.acquire(), c2 => {
              expect(db.size).to.be.at.least(2)
              expect(c1).not.to.equal(c2)
            })
          }
        }))

      it('rejects on error', () =>
        expect(using(db.acquire(), failure))
          .to.eventually.be.rejected)

      it('releases on error', () =>
        using(db.acquire(), failure)
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

      it('can be run multiple times', () =>
        expect((async function () {
          await db.run('CREATE TABLE s(a)')

          await db.prepare('INSERT INTO s VALUES (?)', stmt =>
            all(times(9, i => stmt.run(i))))

          return db.get('SELECT COUNT(*) AS count FROM s')

        }())).to.eventually.have.property('count', 9))
    })

    describe('#exec()', () => {
      it('executes arbitrary sql', () =>
        expect(db.exec('SELECT * FROM sqlite_master;'))
          .to.eventually.be.fulfilled)

      it('rejects on error', () =>
        expect(db.exec('SELECT foobar FROM sqlite_master;'))
          .to.eventually.be.rejected)

      it('acquires connection for every call', () => {
        expect(db.busy).to.eql(0)
        db.exec('SELECT * FROM sqlite_master;')
        expect(db.busy).to.eql(1)
        db.exec('SELECT * FROM sqlite_master;')
        expect(db.busy).to.eql(db.max > 1 ? 2 : 1)
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
        expect(db.seq(failure)).to.eventually.be.rejected)

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
      it('rejects on error', () =>
        expect(db.transaction(failure)).to.eventually.be.rejected)

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

            // Checks dirty read (skip if max 1 connection)
            if (db.max > 1) {
              await expect(db.get('SELECT a FROM t1'))
                .to.eventually.be.rejected
            }

          }).then(() => db.get('SELECT a FROM t1'))

        ).to.eventually.be.fulfilled
          .and.have.property('a', 42)
      ))
    })

    describe('#migration()', () => {
      beforeEach(() => db.seq(conn => all([
        conn.run('CREATE TABLE m1 (id INTEGER PRIMARY KEY)'),
        conn.run('CREATE TABLE m2 (m1id REFERENCES m1(id))')
      ])))

      beforeEach(() => {
        sinon.spy(Connection.prototype, 'check')
        sinon.spy(Connection.prototype, 'commit')
        sinon.spy(Connection.prototype, 'rollback')
      })

      afterEach(() => {
        Connection.prototype.check.restore()
        Connection.prototype.commit.restore()
        Connection.prototype.rollback.restore()
      })

      it('rejects back on error', () =>
        expect(db.migration(failure)).to.eventually.be.rejected)

      it('rolls back on error', () =>
        db.migration(failure).catch(() => {
          expect(Connection.prototype.check).not.to.have.been.called
          expect(Connection.prototype.commit).not.to.have.been.called
          expect(Connection.prototype.rollback).to.have.been.called
        }))

      it('rolls back on fk constraint violation', () =>
        db
          .migration(tx => tx.run('INSERT INTO m2 VALUES (23)'))
          .catch(() => {
            expect(Connection.prototype.check).to.have.been.called
            expect(Connection.prototype.commit).not.to.have.been.called
            expect(Connection.prototype.rollback).to.have.been.called
          }))

      it('checks and commits on success', () =>
        db.migration(() => {}).then(() => {
          expect(Connection.prototype.check).to.have.been.called
          expect(Connection.prototype.commit).to.have.been.called
          expect(Connection.prototype.rollback).not.to.have.been.called
        }))
    })

    describe('concurrency', () => {
      const NUM_READ = 8
      const NUM_WRITE = 6

      beforeEach(() =>
        db.run('CREATE TABLE cc (a)'))

      describe('on multiple connections', () => {
        function count() {
          return db.get('SELECT COUNT(*) AS count FROM cc')
        }

        function write(value) {
          return db.transaction(tx =>
              tx.run('INSERT INTO cc VALUES (?)', value))
        }

        it('supports parallel reading', () =>
          expect(
            map(times(NUM_READ, count), res => res.count)
          ).to.eventually.eql(times(NUM_READ, () => 0)))

        it('supports parallel writing transactions', () =>
          expect(
            map(times(NUM_WRITE, write), x => x).then(count)
          ).to.eventually.have.property('count', NUM_WRITE))

      })
    })
  })
})

describe('Connection', () => {
  let conn

  beforeEach(() => {
    conn = new Connection()
    sinon.stub(conn, 'exec')
  })

  describe('#configure', () => {
    it('sets the given pragmas', () => {
      conn.configure({ busy_timeout: 2500 })
      expect(conn.exec)
        .to.have.been.calledWith('PRAGMA busy_timeout = 2500;')
    })
  })
})
