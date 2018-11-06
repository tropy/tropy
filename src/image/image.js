'use strict'

require('../common/promisify')

const { basename, extname } = require('path')
const { createReadStream, statAsync: stat } = require('fs')
const { createHash } = require('crypto')
const { exif } = require('./exif')
const { isSVG } = require('./svg')
const sharp = require('sharp')
const { assign } = Object
const { warn, debug } = require('../common/log')
const { get, pick } = require('../common/util')
const MIME = require('../constants/mime')


class Image {
  static read(path) {
    return (new Image(path)).read()
  }

  static async check({
    path,
    consolidated,
    created,
    checksum
  }, { force } = {}) {
    let status = {}

    try {
      let { mtime } = await stat(path)
      status.hasChanged = (mtime > (consolidated || created))

      if (force || created == null || status.hasChanged) {
        status.image = await Image.read(path)
        status.hasChanged = (status.image.checksum !== checksum)
      }
    } catch (error) {
      debug(`image check failed for ${path}: ${error.message}`, {
        stack: error.stack
      })

      status.hasChanged = true
      status.image = null
      status.error = error
    }

    return status
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
    if (this.__digest == null) {
      this.__digest = this.digest()
    }
    return this.__digest
  }

  get orientation() {
    return get(this.exif, ['Orientation'], 1)
  }

  get width() {
    return get(this.meta, ['width'], 0)
  }

  get height() {
    return get(this.meta, ['height'], 0)
  }

  get date() {
    try {
      // temporarily return as string until we add value types
      return get(this.exif, ['DateTimeOriginal'], this.ctime).toISOString()

    } catch (error) {
      warn(`failed to convert image date: ${error.message}`)
      debug(error.stack)

      return new Date().toISOString()
    }
  }

  get ctime() {
    return get(this.file, ['ctime'])
  }

  get size() {
    return get(this.file, ['size'])
  }

  digest(encoding = 'hex') {
    return this.hash && this.hash.digest(encoding)
  }

  open(page = this.page) {
    return sharp(this.data || this.path, { density: 720, page })
  }

  read() {
    return new Promise((resolve, reject) => {
      this.hash = createHash('md5')
      this.mimetype = null
      this.page = 0
      this.numPages = 0

      let chunks = []

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
          let data = Buffer.concat(chunks)

          switch (this.mimetype) {
            case MIME.GIF:
            case MIME.JPEG:
            case MIME.PNG:
            case MIME.SVG:
              this.data = data
              break
            case MIME.TIFF:
              this.data = data
              break
            default:
              return reject(new Error('unsupported image'))
          }

          Promise
            .all([this.open().metadata(), stat(this.path)])

            .then(([meta, file]) => assign(this, {
              exif: exif(meta.exif),
              file,
              meta
            }))

            .then(resolve, reject)
        })
    })
  }

  resize(...args) {
    return this.open().resize(...args)
  }

  toJSON() {
    return pick(this, [
      'path',
      'checksum',
      'mimetype',
      'width',
      'height',
      'orientation',
      'size'
    ])
  }
}


const magic = (buffer) => {
  if (buffer != null || buffer.length > 24) {
    if (isGIF(buffer)) return MIME.GIF
    if (isJPEG(buffer)) return MIME.JPEG
    if (isPNG(buffer)) return MIME.PNG
    if (isSVG(buffer)) return MIME.SVG
  }
}

const isGIF = (b) => (
  b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46
)

const isJPEG = (b) => (
  b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF
)

const isPNG = (b) => (
  b.slice(0, 8).compare(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) === 0
)

module.exports = {
  Image
}
