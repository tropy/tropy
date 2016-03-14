'use strict'

const { readdirAsync: ls, readFileAsync: read } = require('fs')
const { basename, extname, resolve } = require('path')

const root = resolve(__dirname, '..', 'db', 'migrate')


class Migration {

  static async all(dir = root) {
    return (await ls(dir)).map(this)
  }

  constructor(path) {
    this.path = path
    this.type = extname(this.path).slice(1)
    this.number = Number(basename(path).split('.', 2)[0])
  }

  async up(db) {
    return (this.type === 'js') ?
      require(this.path).up(db) :
      db.run(await read(this.path))
  }

}

module.exports = Migration
