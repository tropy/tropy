'use strict'

const { verbose } = require('./common/log')

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
    verbose(`restoring ${this.expand(name)}...`)
    return JSON.parse(localStorage.getItem(this.expand(name)))
  }

  save(name, object) {
    if (object != null) {
      localStorage.setItem(this.expand(name), JSON.stringify(object))
      verbose(`${this.expand(name)} persisted`)
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
