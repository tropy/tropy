'use strict'

const { join } = require('path')
const ROOT = join(__dirname, '..', 'fixtures')

global.F = {
  images(name) {
    return {
      path: join(ROOT, 'images', name)
    }
  },

  db(name) {
    return {
      path: join(ROOT, 'db', name)
    }
  },

  plugins(...args) {
    return {
      path: join(ROOT, 'plugins', ...args)
    }
  },

  views(...args) {
    return {
      path: join(ROOT, 'views', ...args)
    }
  },

  get items() {
    return require(join(ROOT, 'items'))
  },

  get lists() {
    return require(join(ROOT, 'lists'))
  },

  get metadata() {
    return require(join(ROOT, 'metadata'))
  },

  get projects() {
    return require(join(ROOT, 'projects'))
  },

  get tags() {
    return require(join(ROOT, 'tags'))
  }
}
