'use strict'

const { join } = require('node:path')
const ROOT = join(__dirname, '../fixtures')

global.F = new Proxy({
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

  schema(name) {
    return {
      path: join(ROOT, '../../db/schema', `${name}.sql`)
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

  get preload() {
    return join(__dirname, 'bootstrap.cjs')
  }
}, {
  get(obj, name) {
    if (name in obj)
      return obj[name]
    else
      return require(join(ROOT, name)).default
  }
})
