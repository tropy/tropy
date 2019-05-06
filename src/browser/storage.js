'use strict'

require('../common/promisify')

const { join } = require('path')
const { readFileAsync: read } = require('fs')
const { write } = require('../common/atomic')

class Storage {
  constructor(path) {
    this.path = path
    this.save.sync = (name, object) =>
      write.sync(this.expand(name), JSON.stringify(object))
  }

  async load(name, defaults) {
    try {
      return {
        ...defaults,
        ...JSON.parse(await read(this.expand(name)))
      }
    } catch (error) {
      if (defaults != null && error.code === 'ENOENT')
        return { ...defaults }
      else throw error
    }
  }

  async save(name, object) {
    return write(this.expand(name), JSON.stringify(object))
  }

  expand(name) {
    return join(this.path, name)
  }
}

module.exports = Storage
