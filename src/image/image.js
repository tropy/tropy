'use strict'

const fs = require('fs')
const { readFile, stat } = fs.promises
const { basename, extname } = require('path')
const { createHash } = require('crypto')
const { exif } = require('./exif')
const { xmp } = require('./xmp')
const { isSVG } = require('./svg')
const sharp = require('sharp')
const { assign } = Object
const { warn } = require('../common/log')
const { get, pick } = require('../common/util')
const { EXIF, MIME, IMAGE } = require('../constants')


class Image {
  static open({
    path,
    protocol,
    density = 300,
    page = 0,
    useLocalTimezone = false }) {
    return (new Image(path, protocol, useLocalTimezone)).open({ page, density })
  }

  static async check({
    path,
    page,
    protocol,
    consolidated,
    created,
    checksum
  }, { force, useLocalTimezone, density } = {}) {
    let status = {}

    try {
      if (!force && created != null) {
        if (protocol === 'file') {
          let { mtime } = await stat(path)
          status.hasChanged = (mtime > (consolidated || created))
        }
        // TODO check via HTTP HEAD
      }

      if (force || created == null || status.hasChanged) {
        status.image = await Image.open({
          path,
          page,
          protocol,
          density,
          useLocalTimezone })
        status.hasChanged = (status.image.checksum !== checksum)
      }
    } catch (e) {
      status.hasChanged = true
      status.image = null
      status.error = e
    }

    return status
  }

  constructor(path, protocol, useLocalTimezone = false) {
    if (protocol == null) {
      let m = path.match(/^(https?):\/\//i)
      if (m == null) {
        protocol = 'file'
      } else {
        protocol = m[1].toLowerCase()
        path = path.slice(m[0].length)
      }
    }

    this.protocol = protocol
    this.path = path
    this.tz = useLocalTimezone ? (new Date().getTimezoneOffset()) : 0
  }

  get ext() {
    return extname(this.path)
  }

  get filename() {
    return basename(this.path)
  }

  get url() {
    return `${this.protocol}://${this.path}`
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
      ...this.xmp[this.page]
    }
  }

  get date() {
    try {
      let time = get(this.exif, [this.page, EXIF.dateTimeOriginal, 'text']) ||
        get(this.exif, [this.page, EXIF.dateTime, 'text'])

      // Temporarily return as string until we add value types.
      return (time || this.file.ctime || new Date()).toISOString()

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
    return sharp(this.buffer || this.path, {
      page,
      density: this.density
    })
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

  async open({ page = 0, density } = {}) {
    this.file = null
    this.buffer = null
    this.mimetype = null
    this.hash = null
    this.page = 0
    this.numPages = 1

    let buffer

    if (this.protocol === 'file') {
      this.file = await stat(this.path)
      buffer = await readFile(this.path)
    } else {
      let response = await fetch(this.url, { redirect: 'follow' })

      if (!response.ok)
        throw new Error(`failed to fetch remote image: ${response.status}`)

      buffer = Buffer.from(await response.arrayBuffer())
      this.file = { size: buffer.length }
    }

    return this.parse(buffer, { page, density })
  }

  async parse(buffer, { page, density }) {
    this.mimetype = magic(buffer, this.ext)

    switch (this.mimetype) {
      case MIME.PDF:
        this.density = density
        // eslint-disable-next-line no-fallthrough
      case MIME.TIFF:
        this.numPages = (await sharp(buffer).metadata()).pages
        // eslint-disable-next-line no-fallthrough
      case MIME.GIF:
      case MIME.JPEG:
      case MIME.PNG:
      case MIME.SVG:
      case MIME.WEBP:
      case MIME.HEIC:
      case MIME.HEIF:
        this.hash = createHash('md5')
        this.hash.update(buffer)
        this.buffer = buffer
        break
      default:
        throw new Error('unsupported image')
    }

    if (page && page < this.numPages) {
      this.page = page
    }

    let meta = await Promise.all([
      ...this.each(img => img.metadata())
    ])

    assign(this, {
      exif: meta.map(m => exif(m.exif, { timezone: this.tz })),
      meta,
      xmp: meta.map(m => xmp(m.xmp))
    })

    return this
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
      'protocol',
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

    if (!isSelection || this.isRemote || !IMAGE.WEB[this.mimetype]) {
      variants.push('full')
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

const Orientation = (o) => (o > 0 && o < 9) ? Number(o) : 1

const magic = (buffer, ext) => {
  if (buffer != null) {
    if (isJPEG(buffer))
      return MIME.JPEG
    if (isPNG(buffer))
      return MIME.PNG
    if (isTIFF(buffer))
      return MIME.TIFF
    if (isPDF(buffer))
      return MIME.PDF
    if (isGIF(buffer))
      return MIME.GIF
    if (isSVG(buffer))
      return MIME.SVG
    if (isWebP(buffer))
      return MIME.WEBP
    if (isHEIF(buffer))
      return ext.toLowerCase() === '.heic' ? MIME.HEIC : MIME.HEIF
  }
}

const isGIF = (buffer) =>
  check(buffer, [0x47, 0x49, 0x46])

const isHEIF = (buffer) =>
  (/^ftyp((hei|hev)[cms]|heix|mif1)$/).test(buffer.toString('ascii', 4, 12))

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
    check(buffer, [0x57, 0x45, 0x42, 0x50], 8)

const check = (buffer, bytes, offset = 0) =>
  buffer.slice(offset, offset + bytes.length).compare(Buffer.from(bytes)) === 0


module.exports = {
  Image
}
