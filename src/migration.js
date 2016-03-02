'use strict'

const { readdirAsync: ls } = require('fs')
const { basename, resolve } = require('path')
const root = resolve(__dirname, '..', 'db', 'migrate')

class Migration {

  static async all(dir = root) {
    return (await ls(dir)).map(this)
  }

  constructor(path) {
    this.path = path
    [this.version, this.name] = basename(path).split('.')
  }

  up(db) {
    return require(this.path).up(db)
  }

  down(db) {
    return require(this.path).down(db)
  }
}

