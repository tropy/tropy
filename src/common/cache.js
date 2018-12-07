'use strict'

const bb = require('./promisify')
const rm = bb.promisify(require('rimraf'))
const { join, resolve, extname, basename } = require('path')
const {
  mkdirAsync: mkdir,
  readdirAsync: readdir,
  statAsync: stat,
  writeFileAsync: write
} = require('fs')

class Cache {
  constructor(...args) {
    this.root = resolve(...args)
  }

  init = async () => {
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

  list(opts = {}) {
    return readdir(this.root, opts)
  }

  path(...args) {
    return Cache.path(...args)
  }

  prune = async (state) => {
    let check = (file, id, variant, ext) => (
      ext !== '.webp' ||
      !((id in state.photos || (id in state.selections))))

    let files = await this.stale(check)

    if (files.length ) {
      for (let file of files) {
        await rm(this.expand(file))
      }
    }

    return files
  }

  async stale(check) {
    return (await this.list())
      .filter(file => check(file, ...Cache.split(file)))
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

  static split(path) {
    let ext = extname(path)
    return [...basename(path, ext).split('_', 2), ext]
  }
}

module.exports = {
  Cache
}
