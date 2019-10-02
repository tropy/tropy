'use strict'

const MIME = require('./mime')

const SUPPORTED = {
  [MIME.GIF]: true,
  [MIME.HEIC]: true,
  [MIME.HEIC_SEQ]: true,
  [MIME.HEIF]: true,
  [MIME.HEIF_SEQ]: true,
  [MIME.JPEG]: true,
  [MIME.PNG]: true,
  [MIME.PDF]: true,
  [MIME.SVG]: true,
  [MIME.TIFF]: true,
  [MIME.WEBP]: true
}

const isImageSupported = (file) =>
  (typeof file === 'string') ? SUPPORTED[file] : SUPPORTED[file.type]


module.exports = {
  MIN_DENSITY: 72,
  MAX_DENSITY: 300,

  EXT: [
    'gif',
    'heic',
    'heif',
    'jpg',
    'jpeg',
    'pdf',
    'png',
    'svg',
    'tif',
    'tiff',
    'webp'
  ],

  WEB: {
    [MIME.JPG]: true,
    [MIME.PNG]: true,
    [MIME.WEBP]: true,
    [MIME.GIF]: true,
    [MIME.SVG]: true
  },

  SUPPORTED,
  isImageSupported
}
