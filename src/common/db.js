import assert from 'node:assert'
import { EventEmitter } from 'node:events'
import { readFile } from 'node:fs/promises'
import { createPool, Pool } from 'generic-pool'
import { canWrite } from './fs.js'
import Driver from '#sqlite'
import { Migration } from './migration.js'
import { debug, trace, warn } from './log.js'
import { DisposableResource, using } from './disposable.js'
import { Sql } from './sql.js'
import { IntegrityError } from './error.js'


const M = {
  'r': {
    readonly: true, fileMustExist: true
  },
  'w': {
    readonly: false, fileMustExist: true
  },
  'w+': {
    readonly: false, fileMustExist: false
  },
  'wx+': {
    readonly: false, fileMustExist: false
  }
}

// Used for exec (several statements); otherwise the statement's `readonly`.
const IUD = /^\s*(insert|update|delete)/i

{
  // PATCH generic-pool to ensure that no more connections are created
  // while draining the pool!
  let dispense = Pool.prototype._dispense
  Pool.prototype._dispense = function () {
    if (!this._draining) dispense.call(this)
  }
}

export class Database extends EventEmitter {
  static async open (path, { isReadOnly, ...opts } = {}) {
    let ro = (isReadOnly || !(await canWrite(path)))
    return new Database(path, ro ? 'r' : 'w', opts)
  }

  static async create (path, script, ...args) {
    try {
      var db = new Database(path, 'w+', { max: 1 })

      let isEmpty = await db.empty()
      if (isEmpty && script) await script(db, ...args)

      return db.path

    } finally {
      await db?.close()
    }
  }

  static async backup (src, dest, callback) {
    try {
      var db = new Database(src, 'r', { max: 1 })
      return await db.backup(dest, callback)
    } finally {
      await db?.close()
    }
  }

  constructor (path = ':memory:', mode = 'w+', { journalMode, ...opts } = {}) {
    trace({ path, mode }, 'init db')
    super({ captureRejections: true })

    this.path = path
    this.mode = mode
    this.journalMode = journalMode

    // Bumped by every write: caches of query results check it.
    this.generation = 0

    // One connection unless the driver can wait for locks without
    // blocking this thread (a worker: Driver.concurrent). Synchronous
    // connections on one thread cannot wait for each other's locks:
    // a writer would block the thread the lock holder needs.
    let { max = 3, ...rest } = opts

    this.pool = createPool({
      create: () => this.create(),
      destroy: (conn) => this.destroy(conn)
    }, {
      min: 0,
      idleTimeoutMillis: 1000 * 60 * 3,
      acquireTimeoutMillis: 1000 * 60,
      ...rest,
      max: Driver.concurrent ? max : 1
    })

    this.pool
      .on('factoryCreateError', (err) => {
        warn({ err }, 'failed to create db connection')
        // Reject the pending request instead of waiting for it to time out!
        this.pool._waitingClientsQueue.dequeue()?.reject(err)
      })
      .on('factoryDestroyError', (err) => {
        this.emit('error', err)
      })
  }

  migrate = async (...args) => {
    let version = await this.version()
    let migrations = await Migration.since(version, ...args)

    trace(`db schema version #${version}`)
    for (let migration of migrations) {
      await migration.up(this)
    }

    return migrations
  }

  get busy () {
    return this.pool.size - this.pool.available
  }

  get isReadOnly () {
    return this.mode === 'r'
  }

  async create (mode = this.mode) {
    trace({ mode, path: this.path }, 'open db')

    let db = new Driver(this.path, M[mode])

    // TODO migrations currently require defensife off
    await db.unsafeMode(true)

    let conn = new Connection(db, {
      onWrite: (query) => {
        // Technically the write can still fail, we record the intent.
        this.hasBeenModified = true
        this.generation++
        this.emit('update', query)
      }
    })

    let options = { ...Connection.defaults }

    if (this.journalMode === 'wal') {
      options['journal_mode'] = 'wal'
      options['synchronous'] = 'normal'
    }

    await conn.configure(options)
    this.emit('create')

    return conn
  }

  async destroy (conn) {
    try {
      trace({ path: this.path }, 'close db connection')

      if (!this.isReadOnly) {
        await conn.optimize().catch((err) => {
          debug({ err, path: this.path }, 'optimize connection failed')
        })
      }

      await conn.close()
      this.emit('destroy')

    } catch (err) {
      // NB: generic-pool does not wait handle async destroy functions
      // so errors thrown here will likely end up as unhandled rejections.
      warn({ err, path: this.path }, 'failed to close db connection')
    }
  }

  acquire (opts = {}) {
    return new DisposableResource(
      this.pool.acquire(),
      conn => this.release(conn, opts.destroy)
    )
  }

  release (conn, destroy = false) {
    return destroy ?
      this.pool.destroy(conn) :
      this.pool.release(conn)
  }

  emitAsync (name) {
    return Promise.all(
      this.rawListeners(name).map(fn => fn())
    )
  }

  close = async () => {
    try {
      // Subtle: call and wait for `will-close` listeners to complete!
      await this.emitAsync('will-close')

      await this.pool.drain()
      await this.pool.clear()

    } catch (err) {
      warn({ err }, 'error while closing db pool')

    } finally {
      this.emit('close')
    }
  }

  empty = async () => {
    const { count } = await this.get(`
      SELECT count(*) AS count FROM sqlite_schema`)

    return count === 0
  }

  seq = (fn, opts) =>
    using(this.acquire(opts), fn)
      .catch(this.handleConnectionError)

  handleConnectionError = (e) => {
    if (e.code === 'SQLITE_READONLY') {
      this.mode = 'r'
      this.emit('error', e)
    }
    throw e
  }

  transaction = (fn) =>
    this.seq(conn => transaction(conn, fn))


  /*
   * Migrations are special transactions which can be used for schema
   * changes, as explained at https://www.sqlite.org/lang_altertable.html
   *
   *   1. Disable foreign keys
   *   2. Start exclusive transaction
   *   3. fn
   *   4. Check foreign key constraints
   *   5. Commit or rollback transaction
   *   6. Enable foreign keys
   */
  migration = (fn) =>
    this.seq(conn =>
      nofk(conn, c =>
        exclusiveTransaction(c, async tx => {
          await fn(tx)
          await tx.check()
        })
      )
    )


  all (...args) {
    return this.seq(conn => conn.all(...args))
  }

  ids (...args) {
    return this.seq(conn => conn.ids(...args))
  }

  each (...args) {
    return this.seq(conn => conn.each(...args))
  }

  get (...args) {
    return this.seq(conn => conn.get(...args))
  }

  run (...args) {
    return this.seq(conn => conn.run(...args))
  }

  exec = async (...args) => {
    await this.seq(conn => conn.exec(...args))
    return this
  }

  version (...args) {
    return this.seq(conn => conn.version(...args))
  }

  compatibility () {
    return this.seq(conn => conn.compatibility())
  }

  check = (...args) =>
    this.seq(conn => conn.check(...args))

  // Returns ratio of free pages that VACUUM would reclaim.
  free = async () => {
    let { free, total } = await this.get(`
      SELECT freelist_count AS free, page_count AS total
        FROM pragma_freelist_count, pragma_page_count`)

    return (total > 0) ? free / total : 0
  }

  async read (path) {
    return this.exec(String(await readFile(path)))
  }

  async backup (dest, callback) {
    let pragma = await this.seq(async conn => {
      await conn.run('VACUUM INTO ?', dest)

      return Object.assign(
        await conn.get('PRAGMA application_id'),
        await conn.get('PRAGMA user_version'))
    })

    try {
      var target = new Database(dest, 'w', { max: 1 })

      await target.seq(async conn => {
        await conn.configure(pragma)
        if (callback) {
          await callback(conn)
        }
      })

    } finally {
      await target?.close()
    }
  }
}


// A connection with better-sqlite3's API (see #sqlite in package.json):
// better-sqlite3 in process, or src/sqlite/proxy.js backed by a worker.
// Driver calls are awaited, so the driver may be synchronous or not.
export class Connection {
  #statements = new Map()

  constructor (db, { onWrite } = {}) {
    this.db = db
    this.onWrite = onWrite
  }

  configure (pragma = Connection.defaults) {
    return this.exec(
      Object
        .entries(pragma)
        .map(nv => `PRAGMA ${nv.join(' = ')};`)
        .join('\n'))
  }

  optimize () {
    return this.exec('PRAGMA optimize;')
  }

  async close () {
    this.#statements.clear()
    await this.db.close()
  }

  // Cached only once prepared: a statement may fail now
  // (e.g. no such table) and succeed after a schema change.
  async statement (sql) {
    let stmt = this.#statements.get(sql)

    if (stmt == null) {
      stmt = await this.db.prepare(sql)
      this.#statements.set(sql, stmt)
    }

    return stmt
  }

  async #call (sql, params, fn) {
    let start = performance.now()

    try {
      let stmt = await this.statement(sql)
      if (!stmt.readonly) this.onWrite?.(sql)

      return await fn(stmt, args(params))

    } catch (err) {
      throw normalize(err)

    } finally {
      profile(sql, performance.now() - start)
    }
  }

  all (sql, ...params) {
    return this.#call(...bind(sql, params), (stmt, values) =>
      stmt.reader ? stmt.all(...values) : (stmt.run(...values), []))
  }

  get (sql, ...params) {
    return this.#call(...bind(sql, params), (stmt, values) =>
      stmt.reader ? stmt.get(...values) : void stmt.run(...values))
  }

  // The first column's row ids (integers, not NULL), in row order,
  // as an Int32Array. The worker driver builds and transfers it
  // (stmt.ids); with better-sqlite3 in process we pluck the column.
  ids (sql, ...params) {
    return this.#call(...bind(sql, params), (stmt, values) => {
      if (stmt.ids)
        return stmt.ids(...values)

      try {
        return Int32Array.from(stmt.pluck(true).all(...values))
      } finally {
        stmt.pluck(false)
      }
    })
  }

  run (sql, ...params) {
    return this.#call(...bind(sql, params), async (stmt, values) => {
      let { changes, lastInsertRowid } = await stmt.run(...values)
      return { id: Number(lastInsertRowid), changes }
    })
  }

  // Calls cb for each row; resolves to the number of rows.
  each (sql, ...params) {
    let cb = params.pop()

    return this.#call(...bind(sql, params), async (stmt, values) => {
      let count = 0

      for await (let row of stmt.iterate(...values)) {
        cb(row)
        count++
      }

      return count
    })
  }

  async exec (sql) {
    let start = performance.now()

    try {
      if (IUD.test(sql)) this.onWrite?.(sql)
      await this.db.exec(sql)
      return this

    } catch (err) {
      throw normalize(err)

    } finally {
      profile(sql, performance.now() - start)
    }
  }

  // The version number is a 10-digit migration number
  // corresponding to the migration's time of creation
  // using the YYMMDDHHMM format. This can be extended
  // to 12 digits if necessary.
  //
  // Until Tropy version 1.12 this number was stored
  // using the user_version PRAGMA, a signed 32-bit integer.
  //
  // Compatibility numbers were added in Tropy 1.18;
  // missing numbers are treated as 0.

  async version (version, compatibility) {
    if (version) {
      assert(Number.isInteger(version) && version > 0,
        `not a valid version number: ${version}`)

      if (compatibility) {
        assert(Number.isInteger(compatibility) && compatibility > 0,
          `not a valid compatibility number: ${compatibility}`)

        await this.run(
          'INSERT INTO migrations (number, compatibility) VALUES (?, ?)',
          version, compatibility)

      } else if (version > 2131122400) {
        await this.run('INSERT INTO migrations (number) VALUES (?)', version)
      } else {
        await this.exec(`PRAGMA user_version = ${version}`)
      }

      return this

    } else {
      try {
        let { number } = await this.get(
          'SELECT number FROM migrations ORDER BY number DESC LIMIT 1')

        return number

      } catch (err) {
        debug({
          err
        }, 'failed to fetch migration number, falling back to user_version')

        let { user_version } = await this.get('PRAGMA user_version')
        return user_version
      }
    }
  }

  async compatibility () {
    try {
      let { number } = await this.get(
        'SELECT max(compatibility) AS number FROM migrations')

      return number ?? 0

    } catch (err) {
      debug({ err }, 'failed to fetch compatibility number')
      return 0
    }
  }

  begin (mode = 'IMMEDIATE') {
    return this.exec(`BEGIN ${mode} TRANSACTION`)
  }

  commit () {
    return this.exec('COMMIT TRANSACTION')
  }

  async rollback (...errors) {
    try {
      await this.exec('ROLLBACK TRANSACTION')
      return this

    } catch (cause) {
      throw new AggregateError(errors, 'rollback transaction failed', { cause })
    }
  }

  async check (table, { maxIntErrors = 10, quick = false } = {}) {
    try {
      if (maxIntErrors > 0) {
        let pragma = quick ? 'quick_check' : 'integrity_check'
        let result = await this.all(`PRAGMA ${pragma}(${maxIntErrors})`)

        if (result.length !== 1 || result[0][pragma] !== 'ok') {
          throw new IntegrityError(
            result.map(f => f[pragma]),
            `${result.length} integrity check(s) failed`)
        }
      }

      let violations = await this.all(
        `PRAGMA foreign_key_check${table ? `('${table}')` : ''}`
      )

      if (violations.length > 0) {
        throw new IntegrityError(
          violations.map(v => `${v.table}[${v.rowid}] -> ${v.parent}#${v.fkid}`),
          `${violations.length} foreign key check(s) failed`)
      }

      return this

    } catch (err) {
      if (err.code !== 'SQLITE_CORRUPT') throw err
      throw new IntegrityError([err.message], err.message, { cause: err })
    }
  }

  static defaults = {
    busy_timeout: '5000',
    cache_size: '-20000',
    foreign_keys: 'on',
    synchronous: 'full',
    temp_store: 'memory'
  }
}


async function nofk (conn, callback) {
  await conn.configure({ foreign_keys: 'off' })

  try {
    let result = await callback(conn)
    return result

  } finally {
    await conn.configure({ foreign_keys: 'on' })
  }
}

async function transaction (conn, callback, mode = 'IMMEDIATE') {
  await conn.begin(mode)

  try {
    let result = await callback(conn)
    await conn.commit()

    return result

  } catch (err) {
    await conn.rollback(err)
    throw err
  }
}

async function exclusiveTransaction (conn, callback) {
  return transaction(conn, callback, 'EXCLUSIVE')
}


function flatten (params) {
  return (params.length === 1) ? params[0] : params
}

function bind (sql, params) {
  if (!(sql instanceof Sql))
    return [sql, flatten(params)]

  assert(params.length === 0, 'sql query takes no extra params')
  return [sql.text, sql.params]
}

// Parameters as better-sqlite3 binds them: positional values spread,
// named ones in an object without their prefix ($, :, @); undefined
// as NULL, booleans as 0/1 and dates as ms, as sqlite3 did.
function args (params) {
  if (params === undefined)
    return []
  if (Array.isArray(params))
    return params.map(value)
  if (isNamed(params))
    return [Object.fromEntries(Object.entries(params).map(([k, v]) =>
      [k.replace(/^[$:@]/, ''), value(v)]))]
  return [value(params)]
}

const value = (v) =>
  (v === undefined) ? null :
    (typeof v === 'boolean') ? Number(v) :
      (v instanceof Date) ? v.getTime() : v

const isNamed = (params) =>
  params != null && typeof params === 'object' &&
  !ArrayBuffer.isView(params) && !(params instanceof Date)

// Errors keep the primary code (e.g. SQLITE_CONSTRAINT for
// SQLITE_CONSTRAINT_UNIQUE), as sqlite3 reported them.
function normalize (err) {
  if (typeof err.code === 'string')
    err.code = (/^SQLITE_[A-Z]+/).exec(err.code)?.[0] ?? err.code
  return err
}

function profile (sql, ms) {
  if (ms < 100)
    trace({ sql, ms }, 'db query')
  else if (ms < 250)
    debug({ sql, ms }, 'db query')
  else
    warn({ sql, ms }, 'slow db query')
}
