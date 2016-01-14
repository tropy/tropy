'use strict'

require('./promisify')

const { resolve, join } = require('path')
const { readFileAsync: read } = require('fs')
const yaml = require('js-yaml')
const root = resolve(__dirname, '..', '..', 'res')

class Resource {
  static get base() {
    return root
  }

  static get ext() {
    return 'yml'
  }

  static parse(data) {
    return yaml.safeLoad(data)
  }

  static async open(name, ...args) {
    return new this(this.parse(await read(this.expand(name))), ...args)
  }

  static expand(name) {
    return join(this.base, `${name}.${this.ext}`)
  }


  constructor(template = []) {
    this.template = template
  }
}

class Menu extends Resource {
  static get base() { return join(super.base, 'menu') }

  constructor(data = {}) {
    super(data[process.platform])
  }
}

class Strings extends Resource {
  static get base() { return join(super.base, 'strings') }

  constructor(data = {}, locale = 'en') {
    this.data = data[locale]
  }
}

module.exports = {
  Resource, Menu, Strings
}
