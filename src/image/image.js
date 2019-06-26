'use strict'

const fs = require('fs')
const { stat } = fs.promises
const { basename, extname } = require('path')
const { createHash } = require('crypto')
const { exif } = require('./exif')
const { xmp } = require('./xmp')
const { isSVG } = require('./svg')
const sharp = require('sharp')
const tiff = require('tiff')
const { assign } = Object
const { warn } = require('../common/log')
const { get, pick } = require('../common/util')
const { EXIF, MIME } = require('../constants')


class Image {
  static open({ path, page = 0, useLocalTimezone = false }) {
    return (new Image(path, useLocalTimezone)).open(page)
  }

  static async check({
    path,
    page,
    consolidated,
    created,
    checksum
  }, { force, useLocalTimezone } = {}) {
    let status = {}

    try {
      let { mtime } = await stat(path)
      status.hasChanged = (mtime > (consolidated || created))

      if (force || created == null || status.hasChanged) {
        status.image = await Image.open({ path, page, useLocalTimezone })
        status.hasChanged = (status.image.checksum !== checksum)
      }
    } catch (e) {
      status.hasChanged = true
      status.image = null
      status.error = e
    }

    return status
  }

  constructor(path, useLocalTimezone = false) {
    this.path = path
    this.tz = useLocalTimezone ? (new Date().getTimezoneOffset()) : 0
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
    return Orientation(
      get(this.exif, [this.page, EXIF.orientation, 'text'], 1)
    )
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

  get data() {
    return {
      ...this.exif[this.page],
      ...this.xmp[this.page],
    }
  }

  get date() {
    try {
      let time = get(this.exif, [this.page, EXIF.dateTimeOriginal, 'text']) ||
        get(this.exif, [this.page, EXIF.dateTime, 'text'])

      // Temporarily return as string until we add value types.
      return (time || this.file.ctime).toISOString()

    } catch (e) {
      warn({ stack: e.stack }, 'failed to convert image date')
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
    return sharp(this.buffer || this.path, { page })
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

  isOpaque = async () => (
    this.channels < 4 || (await this.do().stats()).isOpaque
  )

  open(page = 0) {
    return new Promise((resolve, reject) => {
      this.hash = createHash('md5')
      this.mimetype = null
      this.page = 0
      this.numPages = 1

      let chunks = []

      fs.createReadStream(this.path)
        .on('error', reject)

        .on('data', chunk => {
          this.hash.update(chunk)
          chunks.push(chunk)

          if (chunks.length === 1) {
            this.mimetype = magic(chunk)
          }
        })

        .on('end', () => {
          let buffer = Buffer.concat(chunks)

          switch (this.mimetype) {
            case MIME.GIF:
            case MIME.JPEG:
            case MIME.PNG:
            case MIME.SVG:
            case MIME.WEBP:
              this.buffer = buffer
              break
            case MIME.TIFF:
              this.numPages = tiff.pageCount(buffer)
              this.buffer = buffer
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
              exif: meta.map(m => exif(m.exif, { timezone: this.tz })),
              file,
              meta,
              xmp: meta.map(m => xmp(m.xmp))
            }))

            .then(resolve, reject)
        })
    })
  }

  resize(size, selection) {
    let image = this.do()

    if (selection != null) {
      image = image.extract({
        left: selection.x,
        top: selection.y,
        width: selection.width,
        height: selection.height
      })
    }

    if (size) {
      image = image.resize(size)
    }

    return image
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

  variants(isSelection = false) {
    let SIZE = isSelection ? Image.SELECTION_SIZE : Image.PHOTO_SIZE
    let variants = [48, 512]

    if (!isSelection) {
      switch (this.mimetype) {
        case MIME.TIFF:
          variants.push('full')
          break
      }
    }

    return variants.map(name => ({ name, size: SIZE[name] }))
  }
}

const transparent = { r: 0, g: 0, b: 0, alpha: 0 }

Image.PHOTO_SIZE = {
  48: { width: 48, height: 48, fit: 'cover', position: 'center' },
  512: { width: 512, height: 512, fit: 'cover', position: 'center' }
}

Image.SELECTION_SIZE = {
  48: {
    width: 48, height: 48, fit: 'contain', background: transparent
  },
  512: {
    width: 512, height: 512, fit: 'contain', background: transparent
  }
}

const Orientation = (o) => (o > 0 && o < 9) ? o : 1

const magic = (buffer) => {
  if (buffer != null) {
    if (isJPEG(buffer)) return MIME.JPEG
    if (isPNG(buffer)) return MIME.PNG
    if (isTIFF(buffer)) return MIME.TIFF
    if (isPDF(buffer)) return MIME.PDF
    if (isGIF(buffer)) return MIME.GIF
    if (isSVG(buffer)) return MIME.SVG
    if (isWebP(buffer)) return MIME.WEBP
  }
}

const isGIF = (buffer) =>
  check(buffer, [0x47, 0x49, 0x46])

const isJPEG = (buffer) =>
  check(buffer, [0xFF, 0xD8, 0xFF])

const isPNG = (buffer) =>
  check(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const isPDF = (buffer) =>
  check(buffer, [0x25, 0x50, 0x44, 0x46])

const isTIFF = (buffer) =>
  check(buffer, [0x49, 0x49, 42, 0]) || check(buffer, [0x4d, 0x4d, 0, 42])

const isWebP = (buffer) =>
  check(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    check(buffer.slice(8), [0x57, 0x45, 0x42, 0x50])

const check = (buffer, bytes) =>
  buffer.slice(0, bytes.length).compare(Buffer.from(bytes)) === 0


module.exports = {
  Image
}
