'use strict'

require('./promisify')

const { join, resolve } = require('path')
const { mkdirAsync: mkdir, writeFileAsync: write } = require('fs')


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

  async save(name, data) {
    await write(this.expand(name), data)
  }

  expand(...args) {
    return join(this.root, ...args)
  }
}

function imageURL(cache, ...args) {
  return join(cache, imagePath(...args))
}

function imagePath(image, size, ext) {
  return `photo-${image}_${size}${ext || size < 128 ? '.png' : '.jpg'}`
}

module.exports = {
  Cache,
  imageURL,
  imagePath
}
