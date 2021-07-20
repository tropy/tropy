import fs from 'fs'
const { mkdir, readdir, stat, writeFile } = fs.promises

import { join, extname, basename } from 'path'
import { pathToFileURL } from 'url'
import { debug, warn } from './log'
import { IMAGE, MIME } from '../constants'


class Cache {
  constructor(...args) {
    this.root = join(...args)
  }

  get name() {
    return basename(this.root)
  }

  init = async () => {
    await mkdir(this.root, { recursive: true })

    return this
  }

  save = (name, data) =>
    writeFile(this.expand(name), data)

  exists = (name = '', expand = true) =>
    stat(expand ? this.expand(name) : name)
      .then(() => true, () => false)

  list = (opts = {}) =>
    readdir(this.root, opts)

  stats = async () => {
    let stats = []
    let files = await this.list()

    for (let file of files) {
      stats.push([
        file,
        await stat(this.expand(file))
      ])
    }

    return stats
  }

  consolidate = async (id, image, {
    overwrite = true,
    selection
  } = {}) => {
    try {
      let { page, channels, isOpaque } = image
      let ext = this.extname(image.mimetype)
      let variants = image.variants(!!selection)

      let jp2hack = image.mimetype === MIME.JP2 &&
        image.space === 'b-w' && channels === 3 && image.hasAlpha

      for (let { name, size, quality } of variants) {
        let path = this.path(id, name, ext)

        if (overwrite || !(await this.exists(path))) {
          let dup = await image.resize(size, selection, {
            page,
            jp2hack
          })

          switch (ext) {
            case '.png':
              dup.png()
              break
            case '.webp':
              dup.webp({
                quality,
                lossless: channels === 1 || !isOpaque
              })
              break
            default:
              dup.jpeg({ quality })
          }

          await dup.toFile(this.expand(path))

        } else {
          debug(`skipping ${name} image variant for #${id}: already exists`)
        }
      }
    } catch (e) {
      warn({ stack: e.stack }, 'failed to create image variant')
    }
  }

  expand(...args) {
    return join(this.root, ...args)
  }


  extname(...args) {
    return Cache.extname(...args)
  }

  path(...args) {
    return Cache.path(...args)
  }

  url(...args) {
    return Cache.url(this.root, ...args)
  }

  static extname() {
    return '.webp'
  }

  static path(id, variant, ext) {
    return `${id}_${variant}${ext}`
  }

  static split(path) {
    let ext = extname(path)
    return [...basename(path, ext).split('_', 2), ext]
  }

  static url(root, variant, { id, path, ...photo }) {
    if  (id == null || variant == null)
      return null

    if (Cache.isCacheVariant(variant, photo)) {
      path = join(root, Cache.path(id, variant, Cache.extname(photo.mimetype)))
    }

    let url = pathToFileURL(path)

    if (!photo.broken && photo.consolidated) {
      url.search = `c=${photo.consolidated}`
    }

    return url.toString()
  }

  static isCacheVariant(variant, photo) {
    return (
      (photo.page > 0) ||             // Multi-page
      (variant !== 'full') ||         // Thumbnail
      (photo.protocol !== 'file') ||  // Remote
      !IMAGE.WEB[photo.mimetype]      // Not supported natively
    )
  }
}

export {
  Cache
}
