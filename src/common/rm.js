'use strict'

const util = require('util')
const rimraf = require('rimraf')

module.exports = {
  rm: util.promisify(rimraf)
}
