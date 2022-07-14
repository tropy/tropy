import assert from 'node:assert'
import { EventEmitter } from 'node:events'
import { readFile } from 'node:fs/promises'
import { createPool, Pool } from 'generic-pool'
import { canWrite } from './fs.js'
import sqlite from './sqlite.js'
import { Migration } from './migration.js'
import { debug, info, trace, warn } from './log.js'
import { DisposableResource, using } from './disposable.js'


const M = {
  'r': sqlite.OPEN_READONLY,
  'w': sqlite.OPEN_READWRITE,
  'w+': sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE,
  'wx+': sqlite.OPEN_CREATE
}

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
  static async open(path, { isReadOnly } = {}, opts)  {
    let ro = (isReadOnly || !(await canWrite(path)))
    return new Database(path, ro ? 'r' : 'w', opts)
  }

  static async create(path, script, ...args) {
    try {
      var db = new Database(path, 'w+', { max: 1 })

      let isEmpty = await db.empty()
      if (isEmpty && script) await script(db, ...args)

      return db.path

    } finally {
      if (db) await db.close()
    }
  }

  constructor(path = ':memory:', mode = 'w+', opts = {}) {
    debug({ path, mode }, 'init db')
    super()

    this.path = path
    this.mode = mode

    this.pool = createPool({
      create: () => this.create(),
      destroy: (conn) => this.destroy(conn)
    }, {
      min: 0,
      max: 3,
      idleTimeoutMillis: 1000 * 60 * 3,
      acquireTimeoutMillis: 1000 * 60,
      ...opts
    })

    this.pool
      .on('factoryCreateError', (e) => {
        this.emit('error', e)
      })
      .on('factoryDestroyError', (e) => {
        this.emit('error', e)
      })
  }

  migrate = async (...args) => {
    let version = await this.version()
    let migrations = await Migration.since(version, ...args)

    for (let migration of migrations) {
      await migration.up(this)
    }

    return migrations
  }

  get busy() {
    return this.pool.size - this.pool.available
  }

  get isReadOnly() {
    return this.mode === 'r'
  }

  create(mode = this.mode) {
    return new Promise((resolve, reject) => {
      info({ mode }, `open db ${this.path}`)

      let db = new sqlite.Database(this.path, M[mode], (error) => {
        if (error) {
          return reject(error)
        }

        new Connection(db)
          .configure()
          .then(conn => {
            this.emit('create')
            resolve(conn)
          }, reject)
      })

      db.on('error', (error) => {
        this.emit('error', error)
      })

      db.on('profile', (query, ms) => {
        if (IUD.test(query)) {
          this.emit('update', query)
        }

        let msg = `db query took ${ms}ms`

        if (ms < 100)
          trace({ msg, query, ms })
        else if (ms < 200)
          info({ msg, query, ms })
        else
          warn({ query, ms }, `SLOW: ${msg}`)
      })
    })
  }

  async destroy(conn) {
    debug({ path: this.path }, 'close db connection')

    await conn.optimize()
    await conn.close()

    this.emit('destroy')
  }

  acquire(opts = {}) {
    return new DisposableResource(
      this.pool.acquire(),
      conn => this.release(conn, opts.destroy)
    )
  }

  release(conn, destroy = false) {
    conn.parallelize()
    return destroy ?
      this.pool.destroy(conn) :
      this.pool.release(conn)
  }

  clear = async () => {
    await this.pool.clear()

    while (this.pool.available > this.pool.size) {
      this.pool._availableObjects.pop()
    }

    this.emit('clear')
  }

  close = async () => {
    try {
      await this.pool.drain()
      await this.pool.clear()
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
      nofk(conn, conn =>
        exclusiveTransaction(conn, async tx => {
          await fn(tx)
          await tx.check()
        })
      )
    )


  prepare(...args) {
    let fn = args.pop()

    return this.seq(conn =>
      using(Statement.disposable(conn, ...args), stmt => fn(stmt, conn)))
  }

  all(...args) {
    return this.seq(conn => conn.all(...args))
  }

  each(...args) {
    return this.seq(conn => conn.each(...args))
  }

  get(...args) {
    return this.seq(conn => conn.get(...args))
  }

  run(...args) {
    return this.seq(conn => conn.run(...args))
  }

  exec = async (...args) => {
    await this.seq(conn => conn.exec(...args))
    return this
  }

  version(...args) {
    return this.seq(conn => conn.version(...args))
  }

  check = (...args) =>
    this.seq(conn => conn.check(...args))

  async read(path) {
    return this.exec(String(await readFile(path)))
  }

  static defaults = {
    encoding: 'UTF-8'
  }
}


export class Connection {
  constructor(db) {
    this.db = db
  }

  configure(pragma = Connection.defaults) {
    return this.exec(
      Object
        .entries(pragma)
        .map(nv => `PRAGMA ${nv.join(' = ')};`)
        .join('\n'))
  }

  optimize() {
    return this.exec('PRAGMA optimize;')
  }

  async close() {
    await this.db.closeAsync()
    this.db.removeAllListeners()
  }

  parallelize(...args) {
    return this.db.parallelize(...args), this
  }

  serialize(...args) {
    return this.db.serialize(...args), this
  }

  prepare(...args) {
    const fn = args.pop()
    return using(Statement.disposable(this, ...args), stmt => fn(stmt, this))
  }

  all(sql, ...params) {
    return this.db.allAsync(sql, flatten(params))
  }

  each(...args) {
    return this.db.eachAsync(...args)
  }

  get(sql, ...params) {
    return this.db.getAsync(sql, flatten(params))
  }

  run(sql, ...params) {
    return this.db.runAsync(sql, flatten(params))
  }

  async exec(sql) {
    await this.db.execAsync(sql)
    return this
  }

  // The version number is a 10-digit migration number
  // corresponding to the migration's time of creation
  // using the YYMMDDHHMM format. This can be extended
  // to 12 digits if necessary.
  //
  // Until Tropy version 1.12 this number was stored
  // using the user_version PRAGMA, a signed 32-bit integer.

  async version(version) {
    if (version) {
      assert(typeof version === 'number' && version > 0,
        `not a valid version number: ${version}`)

      if (version > 2131122400)
        await this.run(`INSERT INTO migrations (number) VALUES (${version})`)
      else
        await this.exec(`PRAGMA user_version = ${version}`)

      return this

    } else {
      try {
        let { number } = await this.get(
          'SELECT number FROM migrations ORDER BY number DESC LIMIT 1')

        return number

      } catch (e) {
        warn({
          stack: e.stack
        }, 'failed to fetch migration number, falling back to user_version')

        let { user_version } = await this.get('PRAGMA user_version')
        return user_version
      }
    }
  }

  begin(mode = 'IMMEDIATE') {
    return this.exec(`BEGIN ${mode} TRANSACTION`)
  }

  commit() {
    return this.exec('COMMIT TRANSACTION')
  }

  async rollback(...errors) {
    try {
      await this.exec('ROLLBACK TRANSACTION')
      return this

    } catch (e) {
      throw new AggregateError([e, ...errors])
    }
  }

  async check(table, { maxIntErrors = 10 } = {}) {
    if (maxIntErrors > 0) {
      let result = await this.all(
        `PRAGMA integrity_check(${maxIntErrors})`
      )

      if (result.length !== 1 || result[0].integrity_check !== 'ok') {
        warn({
          stack: result.map(f => `${f.integrity_check}`).join('\n')
        }, 'integrity check failed!')

        throw new Error(`${result.length} integrity check(s) failed`)
      }
    }

    let violations = await this.all(
      `PRAGMA foreign_key_check${table ? `('${table}')` : ''}`
    )

    if (violations.length > 0) {
      warn({
        stack: violations
          .map(v => `${v.table}[${v.rowid}] -> ${v.parent}#${v.fkid}`)
          .join('\n')
      }, 'foreign key check failed!')

      throw new Error(`${violations.length} foreign key check(s) failed`)
    }

    return this
  }

  static defaults = {
    busy_timeout: 5000,
    foreign_keys: 'on'
  }
}


export class Statement {
  static disposable(conn, sql, ...params) {
    return new DisposableResource(
      conn.db.prepareAsync(sql, flatten(params))
        .then(stmt => new Statement(stmt)),

      stmt => stmt.finalize()
    )
  }

  constructor(stmt) {
    this.stmt = stmt
  }

  async bind(...params) {
    await this.stmt.bindAsync(flatten(params))
    return this
  }

  async reset() {
    await this.stmt.resetAsync()
    return this
  }

  async finalize() {
    await this.stmt.finalizeAsync()
    return this
  }

  run(...params) {
    return this.stmt.runAsync(flatten(params))
  }

  get(...params) {
    return this.stmt.getAsync(flatten(params))
  }

  all(...params) {
    return this.stmt.allAsync(flatten(params))
  }

  each(...args) {
    return this.stmt.eachAsync(...args)
  }
}


async function nofk(conn, callback) {
  await conn.configure({ foreign_keys: 'off' })

  try {
    let result = await callback(conn)
    return result

  } finally {
    await conn.configure({ foreign_keys: 'on' })
  }
}

async function transaction(conn, callback, mode = 'IMMEDIATE') {
  await conn.begin(mode)

  try {
    let result = await callback(conn)
    await conn.commit()

    return result

  } catch (e) {
    await conn.rollback(e)
    throw e
  }
}

async function exclusiveTransaction(conn, callback) {
  return transaction(conn, callback, 'EXCLUSIVE')
}


function flatten(params) {
  return (params.length === 1) ? params[0] : params
}
