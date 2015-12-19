'use strict'

const { resolve, join } = require('path')
const { readFileSync: read } = require('fs')
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

  static open(name) {
    return new this(this.parse(read(this.expand(name))))
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

module.exports = {
  Resource,
  Menu
}
