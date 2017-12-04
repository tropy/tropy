'use strict'

require('./promisify')
const { join } = require('path')
const { readFileAsync: read } = require('fs')
const { get, flatten } = require('./util')
const yaml = require('js-yaml')
const { debug } = require('./log')


class Resource {
  static get base() {
    return join(__dirname, '..', '..', 'res')
  }

  static get ext() {
    return '.yml'
  }

  static parse(data) {
    return yaml.safeLoad(data)
  }

  static async open(locale, name, ...args) {
    const res = this.expand(name, locale)
    debug(`open resource ${res}`)

    return new this(this.parse(await read(res)), locale, ...args)
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


class Menu extends Resource {
  static get base() {
    return join(super.base, 'menu')
  }

  constructor(data, locale = 'en') {
    super()
    this.template = get(data, [locale, process.platform], {})
    this.locale = locale
  }
}


class Strings extends Resource {
  static get base() {
    return join(super.base, 'strings')
  }

  static open(locale, ...args) {
    return super.open(locale, process.type, ...args)
  }

  constructor(dict, locale = 'en') {
    super()
    this.dict = get(dict, [locale], {})
    this.locale = locale
  }

  flatten() {
    return flatten(this.dict)
  }
}


class KeyMap extends Resource {
  static get base() {
    return join(super.base, 'keymaps')
  }

  constructor(data, locale = 'en') {
    super()
    this.map = get(data, [locale, process.platform], {})
    this.locale = locale
  }
}

const Icons = {
  color(name, ext = '.png', variant = '') {
    return join(
      Resource.base,
      'icons',
      'colors',
      `${name}${variant}${ext}`)
  }
}

module.exports = {
  Resource,
  Menu,
  Strings,
  KeyMap,
  Icons
}
