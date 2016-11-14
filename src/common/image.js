'use strict'

const { basename, extname } = require('path')
const { createReadStream } = require('fs')
const { createHash } = require('crypto')

function magic(buffer) {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg'
  }
}

class Image {
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

module.exports = {
  Image
}
