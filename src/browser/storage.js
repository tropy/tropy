'use strict'

require('../common/promisify')

const { app } = require('electron')
const { join } = require('path')
const { readFileAsync: read } = require('fs')
const { write } = require('../common/atomic')


class Storage {
  constructor(path = app.getPath('userData')) {
    this.path = path
    this.save.sync = (name, object) =>
      write.sync(this.expand(name), JSON.stringify(object))
  }

  async load(name) {
    return JSON.parse(await read(this.expand(name)))
  }

  async save(name, object) {
    return await write(this.expand(name), JSON.stringify(object))
  }

  expand(name) {
    return join(this.path, name)
  }
}

module.exports = Storage
