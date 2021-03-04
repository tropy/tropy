import fs from 'fs'
import { basename, join } from 'path'
import yaml from 'js-yaml'
import { debug } from './log'
import { paths } from './release'
import { flatten } from './util'


export class Resource {
  static get base() {
    return paths.res
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
      if (error.code !== 'ENOENT' || fallback === locale) throw error
      return this.open(fallback, ...args)
    }
  }

  static expand(name, locale = 'en') {
    return join(this.base, `${name}.${locale.slice(0, 2)}${this.ext}`)
  }
}


export class Menu extends Resource {
  static get base() {
    return join(super.base, 'menu')
  }

  constructor(data, locale = 'en') {
    super()
    this.template = data?.[locale]?.[process.platform] || {}
    this.locale = locale
  }
}


export class Strings extends Resource {
  static get base() {
    return join(super.base, 'strings')
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


export class KeyMap extends Resource {
  static get base() {
    return join(super.base, 'keymaps')
  }

  static open(locale, ...args) {
    return super.open(locale, process.type, ...args)
  }

  constructor(data, locale = 'en') {
    super()
    this.map = data?.[locale]?.[process.platform] || {}
    this.locale = locale
  }
}


export const Icon = {
  base: join(Resource.base, 'icons'),

  color(name, ext = '.png', variant = '') {
    return join(Icon.base, 'colors', `${name}${variant}${ext}`)
  },

  expand(...args) {
    return join(Icon.base, ...args)
  }
}


export const Cursor = {
  base: join(Resource.base, 'cursors'),

  expand(name) {
    return join(Cursor.base, name)
  }
}


export const Shader = {
  base: join(Resource.base, 'shaders'),

  load(name) {
    return fs.readFileSync(join(Shader.base, name), 'utf-8')
  }
}


export const View = {
  base: join(Resource.base, 'views'),

  expand(name) {
    return join(View.base, `${name}.html`)
  }
}


export const Worker = {
  base: join(Resource.base, 'workers'),

  expand(name) {
    return join(Worker.base, `${name}.js`)
  }
}
