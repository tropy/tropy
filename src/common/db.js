'use strict'

require('./promisify')

const sqlite = require('sqlite3')
const ms = require('ms')
const { EventEmitter } = require('events')
const { Migration } = require('./migration')
const { normalize } = require('path')
const { using, resolve } = require('bluebird')
const { readFileAsync: read } = require('fs')
const { createPool } = require('generic-pool')
const { debug, info, verbose, warn } = require('./log')
const entries = require('object.entries')
const { project } = require('../models')


const M = {
  'r': sqlite.OPEN_READONLY,
  'w': sqlite.OPEN_READWRITE,
  'w+': sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE
}

const cache = {}


class Database extends EventEmitter {

  static async create(path, options = {}) {
    try {
      var db = new Database(path, 'w+', { max: 1 })
      await project.create(db, options)

      verbose(`created project db at ${db.path}`)

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

  constructor(path = ':memory:', mode = 'w+', options = {}) {
    super()
    debug(`init db ${path}`)

    this.path = path
    this.pool = createPool({
      create: () => this.create(mode),
      destroy: (conn) => this.destroy(conn)
    }, {
      min: 0,
      max: 4,
      idleTimeoutMillis: 60000,
      ...options,
      validate: (conn) => resolve(conn.db.open)
    })
  }

  async migrate(...args) {
    const version = await this.version()
    const migrations = await Migration.since(version, ...args)

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
      info(`opening db ${this.path}`)

      let db = new sqlite.Database(this.path, M[mode], (error) => {
        if (error) {
          return reject(error), this.emit('error', error)
        }

        new Connection(db)
          .configure()
          .tap(() => this.emit('create'))
          .then(resolve, reject)
      })

      // db.on('trace', query => debug(query))

      db.on('profile', (query, time) => {
        const message = `db query took ${ms(time)}`

        if (ms > 100) {
          return warn(`SLOW: ${message}`, { query, time })
        }

        if (ms > 25) {
          return verbose(message, { query, time })
        }

        debug(message, { query, time })
      })
    })
  }

  destroy(conn) {
    info(`closing db ${this.path}`)
    return conn.close()
      .then(() => this.emit('destroy'))
  }

  acquire() {
    return resolve(this.pool.acquire())
      .disposer(conn => this.release(conn))
  }

  release(conn) {
    conn.parallelize()
    return this.pool.release(conn)
  }


  close = () =>
    this.pool.drain()
      .then(() => this.pool.clear())
      .then(() => this.emit('close'))

  seq = (fn) =>
    using(this.acquire(), fn)

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
          resolve(fn(tx)).then(() => tx.check()))))


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

  exec(...args) {
    return this.seq(conn => conn.exec(...args)).return(this)
  }


  version(...args) {
    return this.seq(conn => conn.version(...args))
  }

  async read(file) {
    return this.exec(String(await read(file)))
  }
}


Database.defaults = {
  application_id: '0xDAEDA105',
  encoding: 'UTF-8'
}


class Connection {
  constructor(db) {
    this.db = db
  }

  configure(pragma = Connection.defaults) {
    return this.exec(entries(pragma)
      .map(nv => `PRAGMA ${nv.join(' = ')};`)
      .join('\n'))
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


  prepare(sql, ...params) {
    return this.db.prepareAsync(sql, flatten(params))
      .then(stmt => new Statement(stmt))
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

  check(table) {
    table = table ? `('${table}')` : ''

    return this
      .all(`PRAGMA foreign_key_check${table}`)
      .then(errors => {
        if (!errors.length) return this

        debug('FK constraint violations detected', { errors })
        throw new Error('FK constraint violations detected')
      })
  }
}


Connection.defaults = {
  busy_timeout: 2000,
  foreign_keys: 'on'
}


class Statement {

  static disposable(conn, ...args) {
    return conn
      .prepare(...args)
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
    return this.stmt.runAsync(flatten(params)).return(this)
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

module.exports = { Database, Connection, Statement, transaction }
