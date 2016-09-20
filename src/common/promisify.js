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
      else resolve(this)
    })
  })
}

module.exports = bb
