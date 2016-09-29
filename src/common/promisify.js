'use strict'

const bb = require('bluebird')

const { Database, Statement } = require('sqlite3')
const { Pool } = require('generic-pool')

bb.promisifyAll(require('fs'))
bb.promisifyAll([Database, Statement, Pool])

Database.prototype.prepareAsync = function (...args) {
  return new bb((resolve, reject) => {
    let stmt = this.prepare(...args, error => {
      if (error) reject(error)
      else resolve(stmt)
    })
  })
}

Database.prototype.runAsync = function (...args) {
  return new bb((resolve, reject) => {
    this.run(...args, function (error) {
      if (error) reject(error)
      else resolve({ id: this.lastID, changes: this.changes })
    })
  })
}

Statement.prototype.runAsync = Database.prototype.runAsync

Database.prototype.eachAsync = function (...args) {
  return new bb((resolve, reject) => {

    if (!args.length || args.length > 3) {
      throw new RangeError(`expected 1-3 arguments, was: ${args.length}`)
    }

    const cb = args.pop()

    if (typeof cb !== 'function') {
      throw new TypeError('callback is not a function')
    }

    let failed = false

    this.each(...args,
      (error, row) => {
        if (failed) return

        if (error) {
          failed = true
          reject(error)
          return
        }

        cb(row)
      },

      (error, rows) => {
        if (error) reject(error)
        else resolve(rows)
      })
  })
}

Statement.prototype.eachAsync = Database.prototype.eachAsync

module.exports = bb
