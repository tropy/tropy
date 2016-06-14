'use strict'

require('./promisify')

const { resolve, join, basename } = require('path')
const { readFileAsync: read, readdirAsync: ls } = require('fs')
const { assign } = Object

const yaml = require('js-yaml')
const root = resolve(__dirname, '..', '..', 'res')

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

  static expand(name) {
    return join(this.base, `${name}${this.ext}`)
  }

  constructor() {
  }
}

class Menu extends Resource {
  static get base() { return join(super.base, 'menu') }

  constructor(data = {}) {
    super()
    this.template = data[process.platform]
  }
}

class Strings extends Resource {
  static get base() { return join(super.base, 'strings') }

  static async all(locale = 'en') {
    const dict = new Strings({ [locale]: {} })

    for (let s of await ls(Strings.base)) {
      dict.merge(await Strings.open(basename(s, Strings.ext), locale))
    }

    return dict
  }

  constructor(data = {}, locale = 'en') {
    super()
    this.data = data[locale]
  }

  merge(other) {
    return (assign(this.data, other.data)), this
  }
}

module.exports = {
  Resource, Menu, Strings
}
