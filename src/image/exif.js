'use strict'

const { debug, warn } = require('../common/log')
debug('EXIF 1')
const exif = require('@inukshuk/exif')
debug('EXIF 2')
const { blank } = require('../common/util')
debug('EXIF 3')
const { text, date } = require('../value')
debug('EXIF 4')

const DEFAULTS = {
  strict: false,
  thumbnail: false,
  printImageMatching: false,
  interoperability: false
}

function toValue(value) {
  if (value instanceof Date) {
    return date(value)
  }
  return text(String(value))
}

module.exports = {
  exif(buffer, opts = {}) {
    if (!blank(buffer)) {
      try {
        let ifd = exif(buffer, { ...DEFAULTS, ...opts })
        if (ifd.errors) {
          debug('EXIF extraction errors', {
            errors: ifd.errors.map(e => [e.offset, e.message])
          })
        }

        return ifd.flatten(true, toValue)

      } catch (error) {
        warn(`EXIF extraction failed: ${error.message}`, {
          stack: error.stack
        })
      }
    }
  }
}
