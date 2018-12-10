'use strict'

const { promisify } = require('util')
const rimraf = require('rimraf')

module.exports = {
  rm: promisify(rimraf)
}
