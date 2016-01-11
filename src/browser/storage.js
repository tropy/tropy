
'use strict'

require('../common/promisify')

const { promisify } = require('bluebird')
const { app } = require('electron')
const { join } = require('path')
const { readFileAsync: read } = require('fs')

const write = promisify(require('write-file-atomic'))
write.sync = require('write-file-atomic').sync


class Storage {
  constructor(path = app.getPath('userData')) {
    this.path = path
    this.save.sync = (name, object) => (
      write.sync(this.expand(name), JSON.stringify(object))
    )
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
