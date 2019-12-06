'use strict'

const Bluebird = require('bluebird')
const { using } = Bluebird
const { normalize } = require('path')
const { createPool } = require('generic-pool')
const { EventEmitter } = require('events')
const { readFile: read } = require('fs').promises
const sqlite = require('./sqlite')
const { Migration } = require('./migration')
const { debug, info, trace, warn } = require('./log')

const M = {
  'r': sqlite.OPEN_READONLY,
  'w': sqlite.OPEN_READWRITE,
  'w+': sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE,
  'wx+': sqlite.OPEN_CREATE
}

const cache = {}
const IUD = /^\s*(insert|update|delete)/i


class Database extends EventEmitter {
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

  static cached(path) {
    path = normalize(path)

    if (!cache[path]) {
      cache[path] = new Database(path, 'w')
        .once('close', () => { cache[path] = null })
    }

    return cache[path]
  }

  constructor(path = ':memory:', mode = 'w+', opts = {}) {
    debug({ path, mode }, 'init db')
    super()

    this.path = path

    this.pool = createPool({
      create: () => this.create(mode),
      destroy: (conn) => this.destroy(conn)
    }, {
      min: 0,
      max: 3,
      idleTimeoutMillis: 1000 * 60 * 5,
      acquireTimeoutMillis: 1000 * 10,
      Promise: Bluebird,
      ...opts
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

  create(mode) {
    return new Promise((resolve, reject) => {
      info(`open db ${this.path}`)

      let db = new sqlite.Database(this.path, M[mode], (error) => {
        if (error) {
          this.emit('error', error)
          return reject(error)
        }

        new Connection(db)
          .configure()
          .tap(() => this.emit('create'))
          .then(resolve, reject)
      })

      db.on('profile', (query, ms) => {
        if (IUD.test(query)) {
          this.emit('update', query)
        }

        let msg = `db query took ${ms}ms`

        if (ms < 100)
          trace({ msg, query, ms })
        if (ms < 200)
          info({ msg, query, ms })
        else
          warn({ query, ms }, `SLOW: ${msg}`)
      })
    })
  }

  async destroy(conn) {
    debug({ path: this.path }, 'close db')

    await conn.optimize()
    await conn.close()

    this.emit('destroy')
  }

  acquire(opts = {}) {
    return this.pool.acquire().disposer(conn =>
      this.release(conn, opts.destroy))
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
    await this.pool.drain()
    await this.pool.clear()
    this.emit('close')
  }

  empty = async () => {
    const { count } = await this.get(`
      SELECT count(*) AS count FROM sqlite_master`)

    return count === 0
  }

  seq = (fn, opts) =>
    using(this.acquire(opts), fn)

  transaction = (fn) =>
    this.seq(conn => using(transaction(conn), fn))


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
      using(nofk(conn), conn =>
        using(transaction(conn, 'EXCLUSIVE'), tx =>
          Bluebird.resolve(fn(tx)).then(() => tx.check()))))


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

  exec = (...args) =>
    this.seq(conn => conn.exec(...args)).return(this)

  version(...args) {
    return this.seq(conn => conn.version(...args))
  }

  check = (...args) =>
    this.seq(conn => conn.check(...args))

  async read(file) {
    return this.exec(String(await read(file)))
  }

  static defaults = {
    application_id: '0xDAEDA105',
    encoding: 'UTF-8'
  }
}


class Connection {
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

  close() {
    return this.db.closeAsync()
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

  exec(sql) {
    return this.db.execAsync(sql).return(this)
  }

  version(version) {
    return (version) ?
      this.exec(`PRAGMA user_version = ${version}`) :
      this.get('PRAGMA user_version').get('user_version')
  }

  begin(mode = 'IMMEDIATE') {
    return this.exec(`BEGIN ${mode} TRANSACTION`)
  }

  commit() {
    return this.exec('COMMIT TRANSACTION')
  }

  rollback() {
    return this.exec('ROLLBACK TRANSACTION')
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


class Statement {
  static disposable(conn, sql, ...params) {
    return conn.db.prepareAsync(sql, flatten(params))
      .then(stmt => new Statement(stmt))
      .disposer(stmt => stmt.finalize())
  }

  constructor(stmt) {
    this.stmt = stmt
  }

  bind(...params) {
    return this.stmt.bindAsync(flatten(params)).return(this)
  }

  reset() {
    return this.stmt.resetAsync().return(this)
  }

  finalize() {
    return this.stmt.finalizeAsync().return(this)
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


function nofk(conn) {
  return conn
    .configure({ foreign_keys: 'off' })
    .disposer(() => conn.configure({ foreign_keys: 'on' }))
}

function transaction(conn, mode = 'IMMEDIATE') {
  return conn
    .begin(mode)
    .disposer((tx, p) => p.isFulfilled() ? tx.commit() : tx.rollback())
}

function flatten(params) {
  return (params.length === 1) ? params[0] : params
}

module.exports = {
  Database,
  Connection,
  Statement,
  transaction
}
