'use strict'

const parse = require('exif-reader')
const { debug, verbose } = require('../common/log')
const { blank } = require('../common/util')
const { text, date } = require('../value')

function mapValues(data) {
  for (let key in data) {
    data[key] = toValue(data[key])
  }
  return data
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
        let data = parse(buffer, { expand: true, ...opts })
        return mapValues({
          ...data.gps,
          ...data.exif,
          ...data.image
        })
      } catch (error) {
        verbose(`EXIF extraction failed: ${error.message}`)
        debug(error.stack)
      }
    }
  }
}
