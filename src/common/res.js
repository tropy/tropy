'use strict'

const { resolve } = require('./promisify')
const { resolve: cd, join } = require('path')
const { readFileAsync: read } = require('fs')
const { flatten } = require('./util')

const yaml = require('js-yaml')
const root = cd(__dirname, '..', '..', 'res')

class Resource {
  static get base() {
    return root
  }

  static get ext() {
    return '.yml'
  }

  static parse(data) {
    return yaml.safeLoad(data)
  }

  static async open(name, ...args) {
    return new this(this.parse(await read(this.expand(name))), ...args)
  }

  static openWithFallback(fallback, name, ...args) {
    return resolve(this.open(name, ...args))
      .catch({ code: 'ENOENT' }, () => this.open(fallback, ...args))
  }

  static expand(name) {
    return join(this.base, `${name}${this.ext}`)
  }
}

class Menu extends Resource {
  static get base() {
    return join(super.base, 'menu')
  }

  constructor(data = {}) {
    super()
    this.template = data[process.platform]
  }
}

class Strings extends Resource {
  static get base() {
    return join(super.base, 'strings')
  }

  static open(locale, ...args) {
    return super.open(locale, locale, ...args)
  }

  static expand(locale) {
    return super.expand(`${process.type}.${String(locale).slice(0, 2)}`)
  }

  constructor(dict = {}, locale = 'en') {
    super()
    this.dict = dict
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

  static open(locale, name, ...args) {
    return super.open(`${name}.${locale}`, locale, ...args)
  }

  constructor(data = {}, locale = 'en') {
    super()
    this.map = data[process.platform]
    this.locale = locale
  }
}

module.exports = {
  Resource, Menu, Strings, KeyMap
}
