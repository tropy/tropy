import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { unlink } from 'node:fs/promises'
import { mktmp } from '../support/tmp.js'
import { pMap, times } from '#tropy/common/util.js'
import { Database, Connection, Statement } from '#tropy/common/db.js'
import { using } from '#tropy/common/disposable.js'

function failure () { throw new Error() }

describe('Database', () => {
  describe('given a database file', () => {
    let dbFile = mktmp('db_test.sqlite')
    let db
    let acquire, release

    beforeEach(() => {
      db = new Database(dbFile)
      acquire = mock.method(db.pool, 'acquire', db.pool.acquire)
      release = mock.method(db.pool, 'release', db.pool.release)
    })

    afterEach(async () => {
      acquire.mock.restore()
      release.mock.restore()
      await db.close()
      await unlink(dbFile).catch((e) => { if (e.code !== 'ENOENT') throw e })
    })

    describe('constructor', () => {
      it('creates an empty connection pool', () => {
        expect(db.pool.size).to.equal(0)
      })
    })

    describe('acquire', () => {
      it('returns a disposable connection', async () =>
        using(db.acquire(), c => {
          expect(acquire.mock.callCount()).to.be.greaterThan(0)
          expect(release.mock.callCount()).to.equal(0)
          expect(c).to.be.instanceof(Connection)
        }).then(() => {
          expect(release.mock.callCount()).to.be.greaterThan(0)
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

      it('rejects on error', async () => {
        await assert.rejects(() => using(db.acquire(), failure))
      })

      it('releases on error', async () => {
        try { await using(db.acquire(), failure) } catch { /* expected */ }
        expect(release.mock.callCount()).to.be.greaterThan(0)
      })
    })

    describe('prepare', () => {
      let finalize

      beforeEach(() => {
        finalize = mock.method(Statement.prototype, 'finalize',
          Statement.prototype.finalize)
      })

      afterEach(() => {
        finalize.mock.restore()
      })

      it('returns disposable statement and connection', async () => {
        await db.prepare('SELECT * FROM sqlite_schema', (stmt, conn) => {
          expect(stmt).to.be.instanceof(Statement)
          expect(conn).to.be.instanceof(Connection)
        })
      })

      it('finalizes statement when done', async () => {
        await db.prepare('SELECT * FROM sqlite_schema', () => {})
        expect(finalize.mock.callCount()).to.be.greaterThan(0)
      })

      it('can be run multiple times', async () => {
        await db.run('CREATE TABLE s(a)')

        await db.prepare('INSERT INTO s VALUES (?)', stmt =>
          Promise.all(times(9, i => stmt.run(i))))

        let result = await db.get('SELECT COUNT(*) AS count FROM s')

        expect(result).to.have.property('count', 9)
      })
    })

    describe('exec', () => {
      it('executes arbitrary sql', async () => {
        await db.exec('SELECT * FROM sqlite_schema;')
      })

      it('rejects on error', async () => {
        await assert.rejects(() => db.exec('SELECT foobar FROM sqlite_schema;'))
      })

      it('acquires connection for every call', async () => {
        expect(db.busy).to.equal(0)
        let c1 = db.exec('SELECT * FROM sqlite_schema;')
        expect(db.busy).to.equal(1)
        let c2 = db.exec('SELECT * FROM sqlite_schema;')
        expect(db.busy).to.equal(db.pool.max > 1 ? 2 : 1)
        await Promise.all([c1, c2])
      })

      it('re-uses connections if possible', async () => {
        expect(db.busy).to.equal(0)
        await db.exec('CREATE TABLE exec (a);')
        expect(db.busy).to.equal(0)
        await db.exec('DROP TABLE exec;')
        expect(db.busy).to.equal(0)
      })

      it('ignores comments', async () => {
        await db.exec(
          `-- A comment
          SELECT * FROM sqlite_schema; -- Another comment`)
      })
    })

    describe('seq', () => {
      it('exposes a connection', () =>
        db.seq(async conn => {
          let spy = mock.fn()

          expect(db.busy).to.equal(1)
          await conn.run('CREATE TABLE a (x)')
          await conn.run('CREATE TABLE b (x)')
          await conn.each('SELECT * FROM sqlite_schema', spy)
          expect(spy.mock.callCount()).to.equal(2)
          expect(db.busy).to.equal(1)
        }))

      it('rejects on error', async () => {
        await assert.rejects(() => db.seq(failure))
      })

      it('does not roll back on error', async () => {
        try {
          await db.seq(async (c) => {
            await c.run('CREATE TABLE s1 (a)')
            await c.run('XNSERT INTO s1 (a) VALUES (1)')
          })
        } catch { /* expected */ }

        await db.run('INSERT INTO s1 (a) VALUES (2)')
        await db.run('DROP TABLE s1')
      })
    })

    describe('transaction', () => {
      it('rejects on error', async () => {
        await assert.rejects(() => db.transaction(failure))
      })

      it('rolls back on error', async () => {
        try {
          await db.transaction(async (tx) => {
            await tx.run('CREATE TABLE t1 (a)')
            await tx.run('XNSERT INTO t1 (a) VALUES (1)')
          })
        } catch { /* expected */ }

        await assert.rejects(() => db.run('INSERT INTO t1 (a) VALUES (2)'))
      })

      it('commits on success', async () => {
        await db.transaction(async (tx) => {
          await tx.run('CREATE TABLE t1 (a)')
          await tx.run('INSERT INTO t1 (a) VALUES (42)')
        })

        let row = await db.get('SELECT a FROM t1')
        expect(row).to.have.property('a', 42)
      })
    })

    describe('check', () => {
      beforeEach(() => db.seq(async conn => {
        await conn.exec('CREATE TABLE t1 (id INTEGER PRIMARY KEY, name)')
        await conn.exec('CREATE TABLE t2 (t1_id REFERENCES t1(id))')
      }))

      it('passes an empty database', async () => {
        await db.check()
      })

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

        it('still passes', async () => {
          await db.check()
        })

        describe('with foreign key violations', () => {
          beforeEach(() => db.seq(async conn => {
            await conn.configure({ foreign_keys: 'off' })
            await conn.exec('DELETE FROM t1 WHERE id = 1')
            await conn.configure({ foreign_keys: 'on' })
          }))

          it('fails with the number of violations', async () => {
            await assert.rejects(
              () => db.check(),
              { message: '2 foreign key check(s) failed' })
          })
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

          it('fails with the number of violations', async () => {
            await assert.rejects(
              () => db.check(),
              { message: '1 integrity check(s) failed' })
          })
        })
      })
    })

    describe('migration', () => {
      let check, commit, rollback

      beforeEach(() => db.seq(conn => Promise.all([
        conn.run('CREATE TABLE m1 (id INTEGER PRIMARY KEY)'),
        conn.run('CREATE TABLE m2 (m1id REFERENCES m1(id))')
      ])))

      beforeEach(() => {
        check = mock.method(Connection.prototype, 'check',
          Connection.prototype.check)
        commit = mock.method(Connection.prototype, 'commit',
          Connection.prototype.commit)
        rollback = mock.method(Connection.prototype, 'rollback',
          Connection.prototype.rollback)
      })

      afterEach(() => {
        check.mock.restore()
        commit.mock.restore()
        rollback.mock.restore()
      })

      it('rejects on error', async () => {
        await assert.rejects(() => db.migration(failure))
      })

      it('rolls back on error', async () => {
        try { await db.migration(failure) } catch { /* expected */ }
        expect(check.mock.callCount()).to.equal(0)
        expect(commit.mock.callCount()).to.equal(0)
        expect(rollback.mock.callCount()).to.be.greaterThan(0)
      })

      it('rolls back on fk constraint violation', async () => {
        try {
          await db.migration(tx => tx.run('INSERT INTO m2 VALUES (23)'))
        } catch { /* expected */ }
        expect(check.mock.callCount()).to.be.greaterThan(0)
        expect(commit.mock.callCount()).to.equal(0)
        expect(rollback.mock.callCount()).to.be.greaterThan(0)
      })

      it('checks and commits on success', async () => {
        await db.migration(() => {})
        expect(check.mock.callCount()).to.be.greaterThan(0)
        expect(commit.mock.callCount()).to.be.greaterThan(0)
        expect(rollback.mock.callCount()).to.equal(0)
      })
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

        it('supports parallel reading', async () => {
          let results = await pMap(times(NUM_READ, count), res => res.count)
          expect(results).to.eql(times(NUM_READ, () => 0))
        })

        it('supports parallel writing transactions', async () => {
          await pMap(times(NUM_WRITE, write), x => x)
          let result = await count()
          expect(result).to.have.property('count', NUM_WRITE)
        })
      })
    })
  })
})

describe('Connection', () => {
  describe('configure', () => {
    it('sets the given pragmas', () => {
      let conn = new Connection()
      let exec = mock.method(conn, 'exec', () => {})

      conn.configure({ busy_timeout: 2500 })
      expect(exec.mock.calls[0].arguments[0])
        .to.equal('PRAGMA busy_timeout = 2500;')
    })
  })
})
