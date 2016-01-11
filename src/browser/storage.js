
'use strict'

require('../common/promisify')

const { app } = require('electron')
const { join } = require('path')
const { readFileAsync: read, writeFileAsync: write } = require('fs')


class Storage {
  constructor(path = app.getPath('userData')) {
    this.path = path
  }

  async load(name) {
    return JSON.parse(await read(this.expand(name), 'utf-8'))
  }

  async store(name, object) {
    return await write(this.expand(name), JSON.stringify(object), 'utf-8')
  }

  expand(name) {
    return join(this.path, name)
  }
}

module.exports = Storage
