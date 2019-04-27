'use strict'

const { isArray } = Array
const { res } = require('./path')

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
      css.imageSet(...path.map(p => res('cursors', p))) :
      css.url(res('cursors', path))} ${x} ${y}, ${fallback}`
  }
}

module.exports = css
