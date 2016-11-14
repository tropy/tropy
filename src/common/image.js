'use strict'

const { basename, extname } = require('path')
const { createReadStream } = require('fs')
const { createHash } = require('crypto')

class Image {
  static read(path) {
    return (new Image(path)).read()
  }

  constructor(path) {
    this.path = path
  }

  get ext() {
    return extname(this.path)
  }

  get filename() {
    return basename(this.path)
  }

  get title() {
    return basename(this.path, this.ext)
  }

  get checksum() {
    return this.digest()
  }

  digest(encoding = 'hex') {
    return this.hash && this.hash.digest(encoding)
  }

  read() {
    return new Promise((resolve, reject) => {

      this.hash = createHash('md5')
      this.mimetype = null

      let isFirstChunk = true

      createReadStream(this.path)
        .on('error', reject)
        .on('end', () => resolve(this))

        .on('data', chunk => {
          this.hash.update(chunk)

          if (isFirstChunk) {
            isFirstChunk = false
            this.mimetype = magic(chunk)
          }
        })
    })
  }
}

function magic(b) {
  if (!b || !b.length) return

  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) {
    return 'image/jpeg'
  }
}

module.exports = {
  Image
}
