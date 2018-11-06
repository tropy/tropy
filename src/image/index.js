'use strict'

const MIME = require('../constants/mime')

const VALID = Object.values(MIME).reduce((valid, type) => (
  (valid[type] = true), valid
), {})

const isValidImage = (file) => VALID[file.type]

module.exports = {
  ...require('./image'),
  isValidImage
}
