'use strict'

const { join } = require('path')
const { Resource } = require('./common/res')
const { isArray } = Array

const css = {
  imageSet(...paths) {
    return `-webkit-image-set(${
      paths.map((path, idx) => `${css.url(path)} ${idx + 1}x`).join(', ')
    })`
  },

  url(string) {
    return `url(${string})`
  },

  cursor(path, { x = 1, y = 1, fallback = 'default' } = {}) {
    return `${isArray(path) ?
      css.imageSet(...path.map(p => join(Resource.base, 'cursors', p))) :
      css.url(join(Resource.base, 'cursors', path))} ${x} ${y}, ${fallback}`
  }
}

module.exports = css
