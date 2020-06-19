'use strict'

const { join } = require('path')
const { Resource } = require('./common/res')
const { win32 } = require('./common/os')
const { isArray } = Array

const css = {
  imageSet(...paths) {
    return `-webkit-image-set(${
      paths.map((path, idx) => `${css.url(path)} ${idx + 1}x`).join(', ')
    })`
  },

  url(path) {
    return `url(file://${win32 ? path.replace(/\\/g, '/') : path})`
  },

  cursor(path, { x = 1, y = 1, fallback = 'default' } = {}) {
    return `${isArray(path) ?
      css.imageSet(...path.map(p => join(Resource.base, 'cursors', p))) :
      css.url(join(Resource.base, 'cursors', path))} ${x} ${y}, ${fallback}`
  },

  rgb(r = 0, g = 0, b = 0, a = 1) {
    return `rgb(${r},${g},${b},${a})`
  }
}

module.exports = css
