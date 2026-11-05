import { promisify } from 'node:util'
import sqlite3 from 'sqlite3'

export default sqlite3

const { Database } = sqlite3

for (let fn of ['close', 'all', 'get', 'exec']) {
  Database.prototype[`${fn}Async`] = promisify(Database.prototype[fn])
}


Database.prototype.runAsync = function (...args) {
  return new Promise((resolve, reject) => {
    this.run(...args, function (error) {
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
        if (error)
          reject(error)
        else
          resolve(rows)
      })
  })
}
