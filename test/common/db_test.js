import { unlink } from 'node:fs/promises'
import { mktmp } from '../support/tmp.js'
import { pMap, times } from '#internal/common/util.js'
import { Database, Connection, Statement } from '#internal/common/db.js'
import { using } from '#internal/common/disposable.js'

function failure() { throw new Error() }

describe('Database', () => {
  describe('given a database file', () => {
    let dbFile = mktmp('db_test.sqlite')
    let db

    beforeEach(() => {
      db = new Database(dbFile)

      sinon.spy(db.pool, 'acquire')
      sinon.spy(db.pool, 'release')
    })

    afterEach(async () => {
      await db.close()
      await unlink(dbFile).catch((e) => { if (e.code !== 'ENOENT') throw e })
    })

    describe('constructor', () => {
      it('creates an empty connection pool', () => {
        expect(db.pool.size).to.equal(0)
      })
    })

    describe('#acquire()', () => {
      it('returns a disposable connection', async () =>
        using(db.acquire(), c => {
          expect(db.pool.acquire).to.have.been.called
          expect(db.pool.release).not.to.have.been.called

          expect(c).to.be.instanceof(Connection)
        }).then(() => {
          expect(db.pool.release).to.have.been.called
        }))

      it('draws from the connection pool', () =>
        using(db.acquire(), c1 => {
          expect(db.pool.size).to.be.at.least(1)

          if (db.pool.max > 1) {
            return using(db.acquire(), c2 => {
              expect(db.pool.size).to.be.at.least(2)
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
      beforeEach(() => {
        sinon.spy(Statement.prototype, 'finalize')
      })

      afterEach(() => {
        Statement.prototype.finalize.restore()
      })

      it('returns disposable statement and connection', () => (
        expect(
          db.prepare('SELECT * FROM sqlite_schema', (stmt, conn) => {
            expect(stmt).to.be.instanceof(Statement)
            expect(conn).to.be.instanceof(Connection)
          })
        ).eventually.to.be.fulfilled
      ))

      it('finalizes statement when done', async () => {
        await db.prepare('SELECT * FROM sqlite_schema', () => {})
        expect(Statement.prototype.finalize).to.have.been.called
      })

      it('can be run multiple times', async () => {
        await db.run('CREATE TABLE s(a)')

        await db.prepare('INSERT INTO s VALUES (?)', stmt =>
          Promise.all(times(9, i => stmt.run(i))))

        let result = await db.get('SELECT COUNT(*) AS count FROM s')

        expect(result).to.have.property('count', 9)
      })
    })

    describe('#exec()', () => {
      it('executes arbitrary sql', () =>
        expect(db.exec('SELECT * FROM sqlite_schema;'))
          .to.eventually.be.fulfilled)

      it('rejects on error', () =>
        expect(db.exec('SELECT foobar FROM sqlite_schema;'))
          .to.eventually.be.rejected)

      it('acquires connection for every call', async () => {
        expect(db.busy).to.eql(0)
        let c1 = db.exec('SELECT * FROM sqlite_schema;')
        expect(db.busy).to.eql(1)
        let c2 = db.exec('SELECT * FROM sqlite_schema;')
        expect(db.busy).to.eql(db.pool.max > 1 ? 2 : 1)
        await Promise.all([c1, c2])
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
          SELECT * FROM sqlite_schema; -- Another comment`
        )).to.eventually.be.fulfilled
      ))
    })

    describe('#seq()', () => {
      it('exposes a connection', () =>
        db.seq(async conn => {
          let spy = sinon.spy()

          expect(db.busy).to.eql(1)
          await conn.run('CREATE TABLE a (x)')
          await conn.run('CREATE TABLE b (x)')
          await conn.each('SELECT * FROM sqlite_schema', spy)
          expect(spy).to.have.been.calledTwice
          expect(db.busy).to.eql(1)
        }))

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
            if (db.pool.max > 1) {
              await expect(db.get('SELECT a FROM t1'))
                .to.eventually.be.rejected
            }

          }).then(() => db.get('SELECT a FROM t1'))

        ).to.eventually.be.fulfilled
          .and.have.property('a', 42)
      ))
    })

    describe('#check()', () => {
      beforeEach(() => db.seq(async conn => {
        await conn.exec('CREATE TABLE t1 (id INTEGER PRIMARY KEY, name)')
        await conn.exec('CREATE TABLE t2 (t1_id REFERENCES t1(id))')
      }))

      it('passes an empty database', () =>
        expect(db.check()).to.eventually.be.fulfilled)

      describe('given data', () => {
        beforeEach(() => db.seq(async conn => {
          await conn.exec('INSERT INTO t1 VALUES (1,"one")')
          await conn.exec('INSERT INTO t1 VALUES (2,"two")')
          await conn.exec('INSERT INTO t1 VALUES (3,"two")')
          await conn.exec('INSERT INTO t1 VALUES (4,null)')
          await conn.exec('INSERT INTO t2 VALUES (1)')
          await conn.exec('INSERT INTO t2 VALUES (2)')
          await conn.exec('INSERT INTO t2 VALUES (1)')
        }))

        it('still passes', () =>
          expect(db.check()).to.eventually.be.fulfilled)

        describe('with foreign key violations', () => {
          beforeEach(() => db.seq(async conn => {
            await conn.configure({ foreign_keys: 'off' })
            await conn.exec('DELETE FROM t1 WHERE id = 1')
            await conn.configure({ foreign_keys: 'on' })
          }))

          it('fails with the number of violations', () =>
            expect(db.check())
              .to.eventually.be.rejectedWith('2 foreign key check(s) failed'))
        })

        describe('with null violations', () => {
          beforeEach(async () => {
            await db.seq(async conn => {
              await conn.configure({ writable_schema: 'on' })
              await conn.run(
                `UPDATE sqlite_schema
                  SET sql = 'CREATE TABLE t1 (id INTEGER PRIMARY KEY, name NOT NULL)'
                  WHERE type = 'table' AND name = 't1'`)
            }, { destroy: true })
          })

          it('fails with the number of violations', () =>
            expect(db.check())
              .to.eventually.be.rejectedWith('1 integrity check(s) failed'))
        })
      })
    })

    describe('#migration()', () => {
      beforeEach(() => db.seq(conn => Promise.all([
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
        let count = () =>
          db.get('SELECT COUNT(*) AS count FROM cc')

        let write = (value) =>
          db.transaction(tx =>
            tx.run('INSERT INTO cc VALUES (?)', value))

        it('supports parallel reading', () =>
          expect(
            pMap(times(NUM_READ, count), res => res.count)
          ).to.eventually.eql(times(NUM_READ, () => 0)))

        it('supports parallel writing transactions', () =>
          expect(
            pMap(times(NUM_WRITE, write), x => x).then(count)
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
