'use strict'

const MIME = {
  GIF: 'image/gif',
  HEIC: 'image/heic',
  HEIC_SEQ: 'image/heic-sequence',
  HEIF: 'image/heif',
  HEIF_SEQ: 'image/heif-sequence',
  JPG: 'image/jpeg',
  JPEG: 'image/jpeg',
  PDF: 'application/pdf',
  PNG: 'image/png',
  SVG: 'image/svg+xml',
  TIF: 'image/tiff',
  TIFF: 'image/tiff',
  WEBP: 'image/webp',
}

const SUPPORTED_IMAGE = {
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

MIME.isImageSupported = (file) => SUPPORTED_IMAGE[file.type]

module.exports = MIME
