'use strict'

require('./promisify')

const { readdirAsync: ls, readFileAsync: read } = require('fs')
const { basename, extname, resolve } = require('path')

const root = resolve(__dirname, '..', 'db', 'migrate')


class Migration {

  static async all(dir = root) {
    return (await ls(dir)).sort().map(this)
  }

  static async since(number = 0, dir = root) {
    return (await this.all(dir)).filter(m => m.fresh(number))
  }

  constructor(path) {
    this.path = path
    this.type = extname(this.path).slice(1)
    this.number = Number(basename(path).split('.', 2)[0])
  }

  up(db) {
    return db.transaction(async function (tx) {
      if (this.type === 'js') {
        await require(this.path).up(tx)
      } else {
        tx.exec(await read(this.path))
      }

      await tx.version(this.number)
    })
  }

  fresh(number) {
    return !number || this.number > number
  }
}

module.exports = Migration
