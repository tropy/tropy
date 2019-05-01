'use strict'

const { info } = require('./common/log')

class Storage {
  static load(name, ...args) {
    return new Storage(...args).load(name)
  }

  static save(name, object, ...args) {
    return new Storage(...args).save(name, object)
  }

  constructor(namespace = 'tropy') {
    this.namespace = namespace
  }

  load(name) {
    info(`restore ${this.expand(name)}...`)
    return JSON.parse(localStorage.getItem(this.expand(name)))
  }

  save(name, object) {
    if (object != null) {
      info(`persist ${this.expand(name)}`)
      localStorage.setItem(this.expand(name), JSON.stringify(object))
    }

    return this
  }

  expand(name) {
    return [name, this.namespace].join('@')
  }
}

module.exports = {
  Storage
}
