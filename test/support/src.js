'use strict'

const { resolve, join } = require('path')

if (!global.__src) {
  global.__src = process.env.COVERAGE ?
    resolve(__dirname, '..', '..', 'lib') :
    resolve(__dirname, '..', '..', 'src')
}

global.__require = function (mod) {
  return require(join(global.__src, mod))
}
