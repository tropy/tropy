'use strict'

const { promisify } = require('bluebird')
const rimraf = require('rimraf')

module.exports = {
  rm: promisify(rimraf)
}
