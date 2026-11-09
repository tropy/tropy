import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { unlink } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { mktmp } from '../support/tmp.js'
import { pMap, times } from '#tropy/common/util.js'
import { Database, Connection } from '#tropy/common/db.js'
import sql, { IN, VALUES } from '#tropy/common/sql.js'
import { using } from '#tropy/common/disposable.js'
import { IntegrityError } from '#tropy/common/error.js'

function failure () { throw new Error() }

// Connections in workers (the renderer) can wait for each other's locks,
// in process (main) they cannot.
const isRenderer = process.type === 'renderer'

// 2500 rows, more than two of the batches 'each' sends.
const N = `WITH RECURSIVE n (x) AS (
  SELECT 1 UNION ALL SELECT x + 1 FROM n WHERE x < 2500
) SELECT x FROM n`

describe('Database', () => {
  describe('given a database file', () => {
    let dbFile = mktmp('db_test.sqlite')
    let db
    let acquire, release

    beforeEach(() => {
      db = new Database(dbFile, 'w+', { max: isRenderer ? 3 : 1 })
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

    describe('when read-only', () => {
      it('closes connections without optimizing', async () => {
        await db.exec('CREATE TABLE t (id)')

        let ro = new Database(dbFile, 'r')
        let optimize = mock.method(Connection.prototype, 'optimize')

        try {
          await ro.get('SELECT 1')
          await ro.close()
          expect(optimize.mock.callCount()).to.equal(0)
        } finally {
          optimize.mock.restore()
        }
      })
    })

    describe('writes', () => {
      it('modify the database once committed', async () => {
        await db.exec('CREATE TABLE t (id)')
        await db.get('SELECT 1')
        expect(db.hasBeenModified).not.to.be.ok

        await db.transaction(async tx => {
          await tx.run('INSERT INTO t VALUES (1)')
          throw new Error('rollback')
        }).catch(() => {})
        expect(db.hasBeenModified).not.to.be.ok

        await db.transaction(tx =>
          tx.run('INSERT INTO t VALUES (2)'))
        expect(db.hasBeenModified).to.be.true
      })

      it('become changes once visible', async () => {
        let changes = []
        db.on('change', () => changes.push(db.generation))
        await db.exec('CREATE TABLE t (id)')

        await db.run('INSERT INTO t VALUES (1)')
        expect(changes).to.eql([1])

        await db.transaction(async tx => {
          await tx.run('INSERT INTO t VALUES (2)')
          await tx.run('INSERT INTO t VALUES (3)')
          expect(changes).to.eql([1])
        })
        expect(changes).to.eql([1, 2])

        await db.transaction(async tx => {
          await tx.run('INSERT INTO t VALUES (4)')
          throw new Error('rollback')
        }).catch(() => {})
        expect(changes).to.eql([1, 2])
      })
    })

    describe('write detection', () => {
      it('covers every kind of call', async () => {
        let changes = []
        db.on('change', () => changes.push(db.generation))
        await db.exec('CREATE TABLE t (id)')

        expect(await db.all('INSERT INTO t VALUES (1) RETURNING id'))
          .to.eql([{ id: 1 }])
        await db.get('INSERT INTO t VALUES (2)')
        await db.exec('INSERT INTO t VALUES (3); INSERT INTO t VALUES (4)')
        expect(changes).to.eql([1, 2, 3])

        await db.all('SELECT * FROM t')
        await db.exec('SELECT * FROM t; DELETE FROM t WHERE id > 4')
        expect(changes).to.eql([1, 2, 3])
      })

      it('covers statements before a failing one', async () => {
        let changes = []
        db.on('change', () => changes.push(db.generation))
        await db.exec('CREATE TABLE t (id)')

        await assert.rejects(
          db.exec('INSERT INTO t VALUES (1); INSERT INTO x VALUES (2)'),
          /no such table/)
        expect(changes).to.eql([1])
      })
    })

    describe('errors', () => {
      it('reject with message and code', async () => {
        await db.exec('CREATE TABLE u (a UNIQUE)')
        await db.run('INSERT INTO u VALUES (1)')

        await assert.rejects(db.run('INSERT INTO u VALUES (1)'), {
          name: 'SqliteError',
          message: /UNIQUE constraint failed/,
          code: 'SQLITE_CONSTRAINT'
        })
      })

      it('do not keep failed statements', () =>
        db.seq(async conn => {
          await assert.rejects(conn.get('SELECT * FROM later'), /no such table/)
          await conn.exec('CREATE TABLE later (a)')
          expect(await conn.get('SELECT * FROM later')).to.be.undefined
        }))
    })

    describe('each', () => {
      it('passes all rows in order', async () => {
        let rows = []
        expect(await db.each(N, ({ x }) => rows.push(x))).to.equal(2500)
        expect(rows).to.eql(times(2500, i => i + 1))
      })

      it('rejects on errors while iterating, after the rows so far', async () => {
        let rows = []
        await assert.rejects(
          db.each(`SELECT CASE WHEN x > 1500 THEN json('x') ELSE x END
            FROM (${N})`, (row) => rows.push(row)),
          /malformed JSON/)
        expect(rows).to.have.length(1000)
      })

      it('rejects with the first callback error, once done', async () => {
        let count = 0
        let error = new Error()

        await assert.rejects(db.each(N, () => {
          if (++count === 10) throw error
        }), (e) => e === error)

        expect(count).to.equal(10)
        expect(await db.get('SELECT 1 AS x')).to.eql({ x: 1 })
      })
    })

    describe('events', () => {
      it('create and destroy pass the connection', async () => {
        let created = []
        let destroyed = []
        db.on('create', c => created.push(c))
        db.on('destroy', c => destroyed.push(c))

        await db.get('SELECT 1')
        expect(created).to.have.length(1)
        expect(created[0]).to.be.instanceof(Connection)

        await db.close()
        expect(destroyed).to.eql(created)
      })
    })

    describe('when the file cannot be opened', () => {
      it('rejects every call without connecting', async () => {
        let missing = new Database(`${dbFile}.missing`, 'r')
        let create = mock.fn()
        missing.on('create', create)

        try {
          await assert.rejects(missing.get('SELECT 1'), { code: 'SQLITE_CANTOPEN' })
          await assert.rejects(missing.get('SELECT 1'), { code: 'SQLITE_CANTOPEN' })
          expect(create.mock.callCount()).to.equal(0)
        } finally {
          await missing.close()
        }
      })
    })

    describe('close', () => {
      it('rejects later calls', async () => {
        await db.get('SELECT 1')
        await db.close()
        await assert.rejects(db.get('SELECT 1'))
      })

      it('can be called again', async () => {
        await db.get('SELECT 1')
        await db.close()
        await db.close()
      })
    })

    describe('locks', () => {
      let other

      beforeEach(async () => {
        await db.exec('CREATE TABLE l (a)')
        other = new Database(dbFile, 'w', { max: 1 })
      })

      afterEach(() => other.close())

      it('reject other writers once the busy timeout ends', () =>
        db.transaction(async tx => {
          await tx.run('INSERT INTO l VALUES (1)')

          await other.seq(async conn => {
            await conn.exec('PRAGMA busy_timeout = 0')
            await assert.rejects(conn.run('INSERT INTO l VALUES (2)'), {
              code: 'SQLITE_BUSY'
            })
          })
        }))

      it('are waited for by other writers', { skip: !isRenderer }, async () => {
        let locked = Promise.withResolvers()

        let first = db.transaction(async tx => {
          await tx.run('INSERT INTO l VALUES (1)')
          locked.resolve()
          await delay(100)
          await tx.run('INSERT INTO l VALUES (2)')
        })

        await locked.promise
        await Promise.all([first, other.run('INSERT INTO l VALUES (3)')])

        expect(await db.all('SELECT a FROM l ORDER BY a'))
          .to.eql([{ a: 1 }, { a: 2 }, { a: 3 }])
      })

      it('do not block readers', { skip: !isRenderer }, () =>
        db.transaction(async tx => {
          await tx.run('INSERT INTO l VALUES (1)')
          expect(await db.get('SELECT count(*) AS n FROM l')).to.eql({ n: 0 })
          expect(await other.get('SELECT count(*) AS n FROM l')).to.eql({ n: 0 })
        }))
    })

    describe('when a worker crashes', { skip: !isRenderer }, () => {
      let crashing

      beforeEach(() => {
        crashing = new Database(dbFile, 'w+', {
          worker: new URL('../fixtures/sqlite/crash.cjs', import.meta.url)
        })
      })

      afterEach(() => crashing.close())

      it('rejects pending and later calls on its connection', () =>
        crashing.seq(async conn => {
          let crash = conn.get('SELECT 1 -- crash')
          let pending = conn.get('SELECT 2')
          await assert.rejects(crash, /crashed/)
          await assert.rejects(pending, /crashed/)
          await assert.rejects(conn.get('SELECT 3'), /crashed/)
          expect(conn.isClosed).to.be.true
        }))

      it('replaces its connection', async () => {
        let destroyed = []
        crashing.on('destroy', c => destroyed.push(c))

        let crashed = await crashing.seq(async conn => {
          await assert.rejects(conn.get('SELECT 1 -- crash'))
          return conn
        })

        expect(destroyed).to.eql([crashed])
        expect(await crashing.get('SELECT 1 AS x')).to.eql({ x: 1 })
        expect(crashing.pool.size).to.equal(1)
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

    describe('get', () => {
      it('columns as properties', async () => {
        expect(await db.get('PRAGMA encoding')).to.eql({
          encoding: 'UTF-8'
        })
      })
    })

    describe('sql', () => {
      it('runs sql fragments', async () => {
        await db.run(sql`CREATE TABLE s (a, b)`)
        await db.run(sql`INSERT INTO s ${VALUES({ a: 1, b: 'x' })}`)
        await db.run(sql`INSERT INTO s ${VALUES({ a: 2, b: 'y' })}`)

        expect(await db.get(sql`SELECT b FROM s WHERE a = ${2}`))
          .to.eql({ b: 'y' })
        expect(await db.all(sql`SELECT a FROM s WHERE a ${IN([1, 2])}`))
          .to.eql([{ a: 1 }, { a: 2 }])

        let rows = []
        await db.each(sql`SELECT a FROM s WHERE b = ${'x'}`, row => {
          rows.push(row)
        })
        expect(rows).to.eql([{ a: 1 }])
      })

      it('returns ids as an Int32Array in row order', async () => {
        await db.run('CREATE TABLE s (a, b)')
        await db.run('INSERT INTO s VALUES (3, 1), (1, 2), (2, 3)')

        let ids = await db.ids(sql`SELECT a FROM s ORDER BY b DESC`)
        expect(ids).to.be.instanceOf(Int32Array)
        expect([...ids]).to.eql([2, 1, 3])

        // The statement still returns rows afterwards.
        expect(await db.all(sql`SELECT a FROM s ORDER BY b DESC`))
          .to.eql([{ a: 2 }, { a: 1 }, { a: 3 }])
      })

      it('rejects extra params', async () => {
        await assert.rejects(db.get(sql`SELECT ${1}`, 2))
        await assert.rejects(db.each(sql`SELECT ${1}`, 2, () => {}))
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

    describe('free', () => {
      it('returns the ratio of free pages', async () => {
        await db.exec(`
          CREATE TABLE f (x);
          WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 1000)
            INSERT INTO f SELECT randomblob(1000) FROM n;`)

        expect(await db.free()).to.equal(0)

        await db.exec('DELETE FROM f')
        expect(await db.free()).to.be.above(0.5)
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
          await conn.exec("INSERT INTO t1 VALUES (1,'one')")
          await conn.exec("INSERT INTO t1 VALUES (2,'two')")
          await conn.exec("INSERT INTO t1 VALUES (3,'two')")
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

          it('fails with the violations, also in the stack', async () => {
            await assert.rejects(() => db.check(), (err) => {
              expect(err).to.be.instanceOf(IntegrityError)
              expect(err.code).to.equal('ECORRUPT')
              expect(err.failures).to.eql(['t2[1] -> t1#0', 't2[3] -> t1#0'])
              expect(err.stack).to.include('    t2[1] -> t1#0')
              return true
            })
          })
        })

        describe('with null violations', () => {
          beforeEach(async () => {
            await db.seq(async conn => {
              await conn.unsafeMode(true)
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
            await assert.rejects(
              () => db.check(null, { quick: true }),
              { message: '1 integrity check(s) failed' })
          })
        })
      })
    })

    describe('backup', () => {
      let dst = mktmp('backup.db')
      let bak

      afterEach(async () => {
        await bak?.close()
        await unlink(dst).catch(() => {})
      })

      it('copies an empty database', async () => {
        await db.backup(dst)
        bak = new Database(dst)
        expect(
          await bak.get('SELECT COUNT(*) AS count FROM sqlite_schema')
        ).to.have.property('count', 0)
      })

      it('copies tables', async () => {
        await db.seq(async conn => {
          await conn.run('CREATE TABLE a (b)')
          await conn.run('INSERT INTO a VALUES (1), (2), (3)')
        })

        await db.backup(dst)
        bak = new Database(dst)

        expect(
          await bak.get('SELECT COUNT(*) AS count FROM a')
        ).to.have.property('count', 3)
      })

      it('copies version pragmas', async () => {
        await db.seq(conn =>
          conn.configure({
            application_id: 23,
            user_version: 5
          }))

        await db.backup(dst)
        bak = new Database(dst)

        expect(await bak.get('PRAGMA application_id'))
          .to.have.property('application_id', 23)
        expect(await bak.get('PRAGMA user_version'))
          .to.have.property('user_version', 5)
      })

      it('runs the transform callback on the target', async () => {
        await db.seq(async conn => {
          await conn.run('CREATE TABLE a (b)')
          await conn.run('INSERT INTO a VALUES (1)')
        })

        await db.backup(dst, conn => conn.run('UPDATE a SET b = 2'))
        bak = new Database(dst)

        expect(await bak.get('SELECT b FROM a'))
          .to.have.property('b', 2)
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
