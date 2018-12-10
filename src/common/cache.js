'use strict'

require('./promisify')

const { join, resolve, extname, basename } = require('path')
const { format } = require('url')

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

  get name() {
    return basename(this.root)
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

  exists = (name = '', expand = true) =>
    stat(expand ? this.expand(name) : name).then(() => true, () => false)

  list = (opts = {}) =>
    readdir(this.root, opts)

  stats = async () => {
    let stats = []
    let files = await this.list()

    for (let file of files) {
      stats.push([
        file,
        await stat(this.expand(file))
      ])
    }

    return stats
  }

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

  static extname() {
    return '.webp'
  }

  static path(id, variant, ext) {
    return `${id}_${variant}${ext}`
  }

  static split(path) {
    let ext = extname(path)
    return [...basename(path, ext).split('_', 2), ext]
  }

  static url(root, id, variant, mimetype) {
    return format({
      protocol: 'file',
      pathname: join(root,
        Cache.path(id, variant, Cache.extname(mimetype)))
    })
  }
}

module.exports = {
  Cache
}
