'use strict'

require('./promisify')

const { join, resolve } = require('path')
const { mkdirAsync: mkdir, writeFileAsync: write } = require('fs')
const { statAsync: stat } = require('fs')

class Cache {
  constructor(...args) {
    this.root = resolve(...args)
  }

  async init() {
    try {
      await mkdir(this.root)
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
    }

    return this
  }

  save = (name, data) =>
    write(this.expand(name), data)

  exists = (name) =>
    stat(name).then(() => true, () => false)

  expand(...args) {
    return join(this.root, ...args)
  }

  extname(...args) {
    return Cache.extname(...args)
  }

  path(...args) {
    return Cache.path(...args)
  }

  url(...args) {
    return Cache.url(this.root, ...args)
  }

  static url(root, id, variant, mimetype) {
    return `file://${
      join(root, Cache.path(id, variant, Cache.extname(mimetype)))
    }`
  }

  static path(id, variant, ext) {
    return `${id}_${variant}${ext}`
  }

  static extname() {
    return '.webp'
  }
}

module.exports = {
  Cache
}
