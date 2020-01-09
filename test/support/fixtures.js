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

  get lists() {
    return require(join(ROOT, 'lists'))
  },

  get projects() {
    return require(join(ROOT, 'projects'))
  }
}
