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
    new sqlite.Database(this.path, (error, db) => {
      callback(error, new Connection(db))
    })
  }

  destroy(db) {
    info(`closing ${this.path}`)
    db.close()
  }


  acquire() {
    return this.pool.acquireAsync()
  }

  release(connection) {
    return this.pool.release(connection)
  }


  all(...args) {
    return this.acquire().call('all', ...args)
  }

  get(...args) {
    return this.acquire().call('get', ...args)
  }

  run(...args) {
    return this.acquire().call('run', ...args)
  }

  exec(...args) {
    return this.acquire().call('exec', ...args)
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
}

module.exports = { Database, Connection }
