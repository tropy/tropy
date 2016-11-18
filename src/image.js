'use strict'

require('./common/promisify')

const { basename, extname } = require('path')
const { createReadStream, statAsync: stat } = require('fs')
const { createHash } = require('crypto')
const { exif } = require('./exif')
const { nativeImage } = require('electron')
const { assign } = Object


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

  get orientation() {
    return this.exif.Orientation || 1
  }

  get date() {
    // temporarily return as string until we add value types
    return String(this.exif.DateTimeOriginal || this.file.ctime)
  }

  digest(encoding = 'hex') {
    return this.hash && this.hash.digest(encoding)
  }

  read() {
    return new Promise((resolve, reject) => {

      this.hash = createHash('md5')
      this.mimetype = null

      const chunks = []

      createReadStream(this.path)
        .on('error', reject)

        .on('data', chunk => {
          this.hash.update(chunk)
          chunks.push(chunk)

          if (chunks.length === 1) {
            this.mimetype = magic(chunk)
          }
        })

        .on('end', () => {
          if (!this.mimetype) {
            return reject(new Error('unsupported image'))
          }

          const buffer = Buffer.concat(chunks)

          Promise
            .all([exif(buffer), ni(buffer), stat(this.path)])

            .then(([data, image, file]) =>
              assign(this, image.getSize(), { exif: data, file }))

            .then(resolve, reject)

        })
    })
  }
}

function ni(buffer) {
  return new Promise((resolve) => {
    resolve(nativeImage.createFromBuffer(buffer))
  })
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
