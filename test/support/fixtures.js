'use strict'

const { resolve, join } = require('path')

const ROOT = resolve(__dirname, '..', 'fixtures')

global.F = {
  images(name) {
    return {
      path: join(ROOT, 'images', name)
    }
  }
}
