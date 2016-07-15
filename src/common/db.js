'use strict'

require('./promisify')

const sqlite = require('sqlite3')
const entries = require('object.entries')

const { Migration } = require('./migration')
const { resolve: cd, join } = require('path')
const { using, resolve } = require('bluebird')
const { readFileAsync: read } = require('fs')
const { Pool } = require('generic-pool')
const { debug, info } = require('./log')

const root = cd(__dirname, '..', '..', 'db')

const M = {
  'r': sqlite.OPEN_READONLY,
  'w': sqlite.OPEN_READWRITE,
  'w+': sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE
}


class Database {
  constructor(path = ':memory:', mode = 'w+') {
    debug(`init db ${path}`)

    this.path = path
    this.pool = new Pool({
      min: 0,
      max: 4,
      idleTimeoutMillis: 60000,
      log: (msg) => debug(msg, { module: 'db:pool' }),
      create: this.create.bind(this, mode),
      destroy: this.destroy.bind(this),
      validate: conn => conn.db.open
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

  get size() {
    return this.pool.getPoolSize()
  }

  get max() {
    return this.pool.getMaxPoolSize()
  }

  get ready() {
    return this.pool.availableObjectsCount()
  }

  get busy() {
    return this.size - this.ready
  }

  create(mode, cb) {
    info(`opening db ${this.path}`)

    let db = new sqlite.Database(this.path, M[mode], (error) => {
      if (error) return cb(error)

      new Connection(db)
        .configure()
        .then(conn => cb(null, conn))
        .catch(cb)
    })

    if (process.env.DEBUG === 'true') {
      db.on('trace', query => debug(query, { module: 'db:trace' }))
    }
  }

  destroy(conn) {
    info(`closing db ${this.path}`)
    conn.close()
  }

  acquire() {
    return this.pool.acquireAsync()
      .disposer(conn => this.release(conn))
  }

  release(conn) {
    try {
      conn.parallelize()

    } finally {
      this.pool.release(conn)
    }
  }


  close() {
    return this.pool.drainAsync().then(() =>
        this.pool.destroyAllNowAsync())
  }


  seq(fn) {
    return using(this.acquire(), fn)
  }

  transaction(fn) {
    return this.seq(conn => using(transaction(conn), fn))
  }

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
  migration(fn) {
    return this.seq(conn =>
        using(nofk(conn), conn =>
          using(transaction(conn, 'EXCLUSIVE'), tx =>
            resolve(fn(tx)).then(() => tx.check()))))
  }


  prepare(...args) {
    let fn = args.pop()

    return this.seq(conn =>
      using(Statement.disposable(conn, ...args), stmt => fn(stmt, conn)))
  }


  all(...args) {
    return this.seq(conn => conn.all(...args))
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
  application_id: '0x0fa1afe1',
  encoding: 'UTF-8'
}

Database.schema = join(root, 'schema.sql')


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

  parallelize() {
    return this.db.parallelize(), this
  }

  serialize() {
    return this.db.serialize(), this
  }


  prepare(sql, ...params) {
    return this.db.prepareAsync(sql, flatten(params))
      .then(stmt => new Statement(stmt))
  }

  all(sql, ...params) {
    return this.db.allAsync(sql, flatten(params))
  }

  get(sql, ...params) {
    return this.db.getAsync(sql, flatten(params))
  }

  run(sql, ...params) {
    return this.db.runAsync(sql, flatten(params)).return(this)
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
    return this.run(`BEGIN ${mode} TRANSACTION`)
  }

  commit() {
    return this.run('COMMIT TRANSACTION')
  }

  rollback() {
    return this.run('ROLLBACK TRANSACTION')
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
