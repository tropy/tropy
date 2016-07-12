'use strict'

const path = require('path')
const resolve = path.resolve
const join = path.join

if (!global.__src) {
  global.__src = process.env.COVERAGE ?
    resolve(__dirname, '..', '..', 'lib') :
    resolve(__dirname, '..', '..', 'src')
}

global.__require = function (mod) {
  return require(join(global.__src, mod))
}
