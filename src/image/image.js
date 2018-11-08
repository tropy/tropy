'use strict'

require('../common/promisify')

const { basename, extname } = require('path')
const { createReadStream, statAsync: stat } = require('fs')
const { createHash } = require('crypto')
const { exif } = require('./exif')
const { isSVG } = require('./svg')
const sharp = require('sharp')
const tiff = require('tiff')
const { assign } = Object
const { warn, debug } = require('../common/log')
const { get, pick } = require('../common/util')
const MIME = require('../constants/mime')


class Image {
  static open(path, page = 0) {
    return (new Image(path)).open(page)
  }

  static async check({
    path,
    page,
    consolidated,
    created,
    checksum
  }, { force } = {}) {
    let status = {}

    try {
      let { mtime } = await stat(path)
      status.hasChanged = (mtime > (consolidated || created))

      if (force || created == null || status.hasChanged) {
        status.image = await Image.open(path, page)
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
    return get(this.exif, [this.page, 'Orientation'], 1)
  }

  get channels() {
    return get(this.meta, [this.page, 'channels'])
  }

  get width() {
    return get(this.meta, [this.page, 'width'], 0)
  }

  get height() {
    return get(this.meta, [this.page, 'height'], 0)
  }

  get date() {
    try {
      // Temporarily return as string until we add value types.
      return get(
        this.exif, [this.page, 'DateTimeOriginal'], this.file.ctime
      ).toISOString()

    } catch (error) {
      warn(`failed to convert image date: ${error.message}`)
      debug(error.stack)

      return new Date().toISOString()
    }
  }

  get size() {
    return get(this.file, ['size'])
  }

  get done() {
    return !(this.page < this.numPages)
  }

  digest(encoding = 'hex') {
    return this.hash && this.hash.digest(encoding)
  }

  do(page = this.page) {
    return sharp(this.data || this.path, { page })
  }

  *each(fn) {
    for (let page = 0; page < this.numPages; ++page) {
      yield fn(this.do(page), page, this.numPages)
    }
  }

  next() {
    return ++this.page
  }

  rewind() {
    this.page = 0
  }

  open(page = 0) {
    return new Promise((resolve, reject) => {
      this.hash = createHash('md5')
      this.mimetype = null
      this.page = 0
      this.numPages = 1

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
            case MIME.WEBP:
              this.data = data
              break
            case MIME.TIFF:
              this.numPages = tiff.pageCount(data)
              this.data = data
              break
            default:
              return reject(new Error('unsupported image'))
          }

          if (page && page < this.numPages) {
            this.page = page
          }

          Promise
            .all([
              stat(this.path),
              ...this.each(img => img.metadata())
            ])

            .then(([file, ...meta]) => assign(this, {
              exif: meta.map(m => exif(m.exif)),
              file,
              meta
            }))

            .then(resolve, reject)
        })
    })
  }

  resize(...args) {
    return (args.length) ?
      this.do().resize(...args) :
      this.do()
  }

  toJSON() {
    return pick(this, [
      'page',
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
  if (buffer != null) {
    if (isJPEG(buffer)) return MIME.JPEG
    if (isPNG(buffer)) return MIME.PNG
    if (isTIFF(buffer)) return MIME.TIFF
    if (isGIF(buffer)) return MIME.GIF
    if (isSVG(buffer)) return MIME.SVG
  }
}

const isGIF = (buffer) =>
  check(buffer, [0x47, 0x49, 0x46])

const isJPEG = (buffer) =>
  check(buffer, [0xFF, 0xD8, 0xFF])

const isPNG = (buffer) =>
  check(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const isTIFF = (buffer) =>
  check(buffer, [0x49, 0x49, 42, 0]) || check(buffer, [0x4d, 0x4d, 0, 42])

const check = (buffer, bytes) =>
  buffer.slice(0, bytes.length).compare(Buffer.from(bytes)) === 0

module.exports = {
  Image
}
