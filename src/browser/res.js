import fs from 'node:fs'
import { basename, join } from 'node:path'
import electron from 'electron'
import yaml from 'js-yaml'
import { debug } from '../common/log.js'
import { flatten } from '../common/util.js'


export class Resource {

  // NB: When the Resource classes are used in Renderer,
  // Resource.base must be re-set to the app path supplied as window argument!
  static get base() {
    return electron.app.getAppPath()
  }

  static get ext() {
    return '.yml'
  }

  static parse(data) {
    return yaml.load(data)
  }

  static async open(locale, name, ...args) {
    const res = this.expand(name, locale)
    debug(`opening resource ${basename(res)}`)

    return new this(
      this.parse(
        await fs.promises.readFile(res)), locale, ...args)
  }

  static async openWithFallback(fallback, locale, ...args) {
    try {
      return (await this.open(locale, ...args))

    } catch (error) {
      if (error.code !== 'ENOENT' || fallback === locale)
        throw error

      if (locale.length > 2)
        return this.openWithFallback(fallback, locale.slice(0, 2), ...args)
      else
        return this.open(fallback, ...args)
    }
  }

  static expand(name, locale = 'en') {
    return join(this.base, `${name}.${locale}${this.ext}`)
  }
}

export class Strings extends Resource {
  static get base() {
    return join(super.base, 'res/strings')
  }

  static open(locale, ...args) {
    return super.open(locale, process.type, ...args)
  }

  constructor(data, locale = 'en') {
    super()
    this.dict = data?.[locale] || {}
    this.locale = locale
  }

  flatten() {
    return flatten(this.dict)
  }
}

export class Menu extends Resource {
  static get base() {
    return join(super.base, 'res/menu')
  }

  constructor(data, locale = 'en') {
    super()
    this.template = data?.[locale]?.[process.platform] || {}
    this.locale = locale
  }
}

export const Icon = {
  get base() {
    return join(Resource.base, 'res/icons')
  },

  color(name, ext = '.png', variant = '') {
    return Icon.expand('colors', `${name}${variant}${ext}`)
  },

  expand(...args) {
    return join(Icon.base, ...args)
  }
}

export const View = {
  get base() {
    return join(Resource.base, 'res/views')
  },

  expand(name) {
    return join(View.base, `${name}.html`)
  }
}
