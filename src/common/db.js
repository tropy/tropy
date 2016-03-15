'use strict'

require('./promisify')

const sqlite = require('sqlite3')

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
    info(`opening ${this.path}`)
    new sqlite.Database(this.path, callback)
  }

  destroy(db) {
    info(`closing ${this.path}`)
    db.close()
  }

  all(...args) {
    return this.pool.acquireAsync()
      .then(db => db.getAsync(...args))
  }

  get(...args) {
    return this.pool.acquireAsync()
      .then(db => db.getAsync(...args))
  }

  run(...args) {
    return this.pool.acquireAsync()
      .then(db => db.runAsync(...args))
  }

  exec(...args) {
    return this.pool.acquireAsync()
      .then(db => db.execAsync(...args))
  }
}

module.exports = { Database }
