'use strict'

const MIME = {
  GIF: 'image/gif',
  JPG: 'image/jpeg',
  JPEG: 'image/jpeg',
  PDF: 'application/pdf',
  PNG: 'image/png',
  SVG: 'image/svg+xml',
  TIF: 'image/tiff',
  TIFF: 'image/tiff',
  WEBP: 'image/webp'
}

const SUPPORTED_IMAGE = {
  [MIME.GIF]: true,
  [MIME.JPEG]: true,
  [MIME.PNG]: true,
  [MIME.SVG]: true,
  [MIME.TIFF]: true,
  [MIME.WEBP]: true
}

MIME.isImageSupported = (file) => SUPPORTED_IMAGE[file.type]

module.exports = MIME
