'use strict'

const MIME = require('../constants/mime')

const isValidImage = (file) => [
  MIME.JPG,
  MIME.PNG,
  MIME.SVG
].includes(file.type)


module.exports = {
  ...require('./image'),
  isValidImage
}
