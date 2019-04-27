'use strict'

const { isArray } = Array
const { res } = require('./path')

const css = {
  imageSet(...paths) {
    return `-webkit-image-set(${
      paths.map((path, idx) => `${css.url(path)} ${idx + 1}x`).join(', ')
    })`
  },

  url(path) {
    return `url(${res('images', path)})`
  },

  cursor(path, { x = 1, y = 1, fallback = 'default' } = {}) {
    return `${isArray(path) ?
      css.imageSet(...path) :
      css.url(path)} ${x} ${y}, ${fallback}`
  }
}

module.exports = css
