import { Asset } from '../asset'
import { exif } from './exif'
import { xmp } from './xmp'
import { sharp, init } from './sharp'
import { warn } from '../common/log'
import { pick, restrict } from '../common/util'
import { rgb } from '../css'
import { IMAGE, MIME } from '../constants'
import { exif as exifns } from '../ontology'
import { getComments } from './jpg'

const Orientation = (o) => (o > 0 && o < 9) ? Number(o) : 1

export class Image extends Asset {
  get orientation() {
    return Orientation(
      this.meta?.[this.page]?.exif?.[exifns.orientation]?.text || 1
    )
  }

  get channels() {
    return this.meta?.[this.page]?.channels
  }

  get space() {
    return this.meta?.[this.page]?.space
  }

  get color() {
    return this.stats?.[this.page]?.color
  }

  get hasAlpha() {
    return this.meta?.[this.page]?.hasAlpha
  }

  get isOpaque() {
    return !this.hasAlpha || (this.stats?.[this.page]?.isOpaque ?? true)
  }

  get width() {
    return this.meta?.[this.page]?.width ?? 0
  }

  get height() {
    return this.meta?.[this.page]?.height ?? 0
  }

  get data() {
    return {
      ...this.meta?.[this.page]?.exif,
      ...this.meta?.[this.page]?.xmp
    }
  }

  get date() {
    try {
      let xif = this.meta?.[this.page]?.exif
      let time = xif?.[exifns.dateTimeOriginal]?.text ||
        xif?.[exifns.dateTime]?.text

      // Temporarily return as string until we add value types.
      return time || super.date.toISOString()

    } catch (e) {
      warn({ stack: e.stack }, 'failed to convert image date')
      return new Date().toISOString()
    }
  }

  get done() {
    return !(this.page < this.numPages)
  }

  do(page = this.page) {
    return sharp(this.buffer || this.path, {
      page,
      density: this.density
    })
  }

  *each(fn, ...args) {
    for (let page = 0; page < this.numPages; ++page) {
      yield fn(this.do(page), page, ...args)
    }
  }

  next() {
    return ++this.page
  }

  rewind() {
    this.page = 0
  }

  async open({ page, density, useLocalTimezone } = {}) {
    this.meta = null
    this.stats = null
    this.page = 0
    this.numPages = 1

    await super.open()
    await this.parse({ page, density, useLocalTimezone })

    return this
  }

  async parse({ page, density = 72, useLocalTimezone }) {
    await init()

    if (!IMAGE.SUPPORTED[this.mimetype])
      throw new Error(`image type not supported: ${this.mimetype}`)

    if (IMAGE.SCALABLE[this.mimetype])
      this.density = restrict(density, IMAGE.MIN_DENSITY, IMAGE.MAX_DENSITY)

    let meta = await this.do().metadata()

    if (meta.pages) {
      this.numPages = meta.pages

      if (page == null)
        page = meta.primaryPage
    }

    this.meta = new Array(this.numPages)
    this.stats = new Array(this.numPages)

    if (this.mimetype === MIME.JPG) {
      try {
        this.description = [...getComments(this.buffer)].join(' ')
      } catch (e) {
        warn({ stack: e.stack }, 'failed to extract jpg comments')
      }
    }

    let timezone = useLocalTimezone ? (new Date().getTimezoneOffset()) : 0

    if (page != null && page < this.numPages) {
      this.page = page
      await this.analyze(this.do(), page, { timezone })

    } else {
      await Promise.all([
        ...this.each(this.analyze, { timezone })
      ])
    }
  }

  analyze = async (img, page, { timezone }) => {
    let meta = await img.metadata()

    this.meta[page] = {
      ...meta,
      exif: exif(meta.exif, { timezone }),
      xmp: xmp(meta.xmp)
    }

    let stats = await img.stats()
    let { dominant, channels, isOpaque } = stats

    // Set dominant color to white if there are transparencies in use!
    if (!isOpaque)
      dominant = { r: 255, g: 255, b: 255 }

    this.stats[page] = {
      isOpaque,
      color: (dominant != null) ?
        rgb(dominant.r, dominant.g, dominant.b) :
        rgb(...channels.slice(0, 3).map(c => Math.round(c.mean)))
    }
  }

  resize = async (size, selection, { page = this.page } = {}) => {
    let image = this.do(page)

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
      'color',
      'density',
      'width',
      'height',
      'orientation'
    ], super.toJSON())
  }

  variants(isSelection = false) {
    let variants = [48, 512]

    if (!isSelection && (
      this.page > 0 ||
      this.isRemote ||
      !IMAGE.WEB[this.mimetype])) {
      variants.push('full')
    }

    return variants.map(name => ({
      name,
      quality: Image.QUALITY[name],
      size: Image.SIZE[name]
    }))
  }

  static SIZE = {
    48: {
      width: 48, height: 48, fit: 'inside'
    },
    512: {
      width: 512, height: 512, fit: 'inside'
    }
  }

  static QUALITY = {
    48: 85, 512: 90, full: 95
  }
}
