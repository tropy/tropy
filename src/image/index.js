'use strict'

require('../common/log').debug('IMG 0')
const MIME = require('../constants/mime')

const SUPPORTED = {
  [MIME.GIF]: true,
  [MIME.JPEG]: true,
  [MIME.PNG]: true,
  [MIME.SVG]: true,
  [MIME.TIFF]: true,
  [MIME.WEBP]: true
}

const isImageSupported = (file) => SUPPORTED[file.type]

module.exports = {
  ...require('./image'),
  isImageSupported
}
