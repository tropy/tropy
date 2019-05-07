'use strict'

const { debug, warn } = require('../common/log')
const exif = require('@inukshuk/exif')
const { blank } = require('../common/util')
const { text, date } = require('../value')

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
          debug({
            stack: ifd.errors.map(e => [e.offset, e.message])
          }, 'EXIF extraction errors')
        }

        return ifd.flatten(true, toValue)

      } catch (e) {
        warn({ stack: e.stack }, 'EXIF extraction failed')
      }
    }
  }
}
