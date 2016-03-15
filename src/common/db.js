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
      min: 1,
      max: 8,
      log,
      create: this.create.bind(this),
      destroy: this.destroy.bind(this)
    })
  }

  create(callback) {
    info(`opening db ${this.path}`)
    new sqlite.Database(this.path, (error, db) => {
      callback(error, new Connection(db))
    })
  }

  destroy(db) {
    info(`closing db ${this.path}`)
    db.close()
  }

  acquire() {
    return this.pool.acquireAsync()
      .disposer(db => { this.pool.release(db) })
  }


  all(...args) {
    return using(this.acquire(), c => { c.all(...args) })
  }

  get(...args) {
    return using(this.acquire(), c => { c.get(...args) })
  }

  run(...args) {
    return using(this.acquire(), c => { c.run(...args) })
  }

  exec(...args) {
    return using(this.acquire(), c => { c.exec(...args) })
  }
}


class Connection {
  constructor(db) {
    this.db = db
  }

  all(...args) {
    return this.db.allAsync(...args)
  }

  get(...args) {
    return this.db.getAsync(...args)
  }

  run(...args) {
    return this.db.runAsync(...args)
  }

  exec(...args) {
    return this.db.execAsync(...args)
  }


  begin() {
    return this.run('BEGIN IMMEDIATE TRANSACTION')
  }

  commit() {
    return this.run('COMMIT TRANSACTION')
  }

  rollback() {
    return this.run('ROLLBACK TRANSACTION')
  }
}

function transaction(connection) {
  return connection
    .begin()
    .disposer((tx, p) => p.isFulfilled() ? tx.commit() : tx.rollback())
}

module.exports = { Database, Connection, transaction }
