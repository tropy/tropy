import { promisify } from 'node:util'
import sqlite3 from 'sqlite3'

export default sqlite3

const { Database } = sqlite3

Database.prototype.closeAsync = promisify(Database.prototype.close)

// TODO better-sqlite3 uses the prepared statement's `readonly`
const IUD = /^\s*(insert|update|delete)/i

for (let fn of ['all', 'get', 'exec']) {
  let query = promisify(Database.prototype[fn])

  Database.prototype[`${fn}Async`] = function (sql, ...args) {
    this.emit('query', sql, !IUD.test(sql))
    return query.call(this, sql, ...args)
  }
}


Database.prototype.runAsync = function (sql, ...args) {
  return new Promise((resolve, reject) => {
    this.emit('query', sql, !IUD.test(sql))
    this.run(sql, ...args, function (error) {
      if (error)
        reject(error)
      else
        resolve({ id: this.lastID, changes: this.changes })
    })
  })
}

Database.prototype.eachAsync = function (...args) {
  return new Promise((resolve, reject) => {

    if (!args.length || args.length > 3) {
      throw new RangeError(`expected 1-3 arguments, was: ${args.length}`)
    }

    let cb = args.pop()
    let sql = args.shift()

    if (typeof cb !== 'function') {
      throw new TypeError('callback is not a function')
    }

    let failed = false

    this.emit('query', sql, !IUD.test(sql))
    this.each(sql, ...args,
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
        if (error)
          reject(error)
        else
          resolve(rows)
      })
  })
}
