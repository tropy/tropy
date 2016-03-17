'use strict'

require('./promisify')

const sqlite = require('sqlite3')

const { using } = require('bluebird')
const { Pool } = require('generic-pool')
const { log, debug, info } = require('./log')


class Database {
  constructor(path = ':memory:') {
    debug(`init db ${path}`)

    this.path = path
    this.pool = new Pool({
      min: 0,
      max: 8,
      idleTimeoutMillis: 60000,
      log,
      create: this.create.bind(this),
      destroy: this.destroy.bind(this)
    })
  }


  get size() {
    return this.pool.getPoolSize()
  }

  get ready() {
    return this.pool.availableObjectsCount()
  }

  get busy() {
    return this.size - this.ready
  }

  create(callback) {
    info(`opening db ${this.path}`)
    let db = new sqlite.Database(this.path, (error) => {
      callback(error, new Connection(db))
    })
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

  prepare(...args) {
    let fn = args.pop()

    return this.seq(conn =>
      conn.prepare(...args).then(stmt => fn(stmt, conn)))
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
    return this.seq(conn => conn.exec(...args))
  }
}


class Connection {
  constructor(db) {
    this.db = db
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


  prepare(...args) {
    return this.db.prepareAsync(...args)
      .then(stmt => new Statement(stmt))
  }

  all(...args) {
    return this.db.allAsync(...args)
  }

  get(...args) {
    return this.db.getAsync(...args)
  }

  run(...args) {
    return this.db.runAsync(...args).return(this)
  }

  exec(...args) {
    return this.db.execAsync(...args).return(this)
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
}


class Statement {
  constructor(stmt) {
    this.stmt = stmt
  }

  bind(...args) {
    return this.stmt.bindAsync(...args).return(this)
  }

  reset() {
    return this.stmt.resetAsync().return(this)
  }

  finalize() {
    return this.stmt.finalizeAsync().return(this)
  }

  run(...args) {
    return this.stmt.runAsync(...args).return(this)
  }

  get(...args) {
    return this.stmt.getAsync(...args)
  }

  all(...args) {
    return this.stmt.allAsync(...args)
  }
}


function transaction(connection) {
  return connection
    .begin()
    .disposer((tx, p) => p.isFulfilled() ? tx.commit() : tx.rollback())
}

module.exports = { Database, Connection, Statement, transaction }
