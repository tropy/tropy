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
}

function imageURL(cache, ...args) {
  return join(cache, imagePath(...args))
}

function imagePath(image, size, ext = '.jpg') {
  return `${image}_${size}${ext}`
}

module.exports = {
  Cache,
  imageURL,
  imagePath
}
