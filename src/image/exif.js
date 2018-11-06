'use strict'

const parse = require('exif-reader')
const { debug, verbose } = require('../common/log')
const { blank } = require('../common/util')

module.exports = {
  exif(buffer) {
    if (!blank(buffer)) {
      try {
        let data = parse(buffer)
        return {
          ...data.gps,
          ...data.exif,
          ...data.image
        }
      } catch (error) {
        verbose(`EXIF extraction failed: ${error.message}`)
        debug(error.stack)
      }
    }
  }
}
