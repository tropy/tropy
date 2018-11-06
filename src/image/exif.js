'use strict'

const parse = require('exif-reader')
const { debug, verbose } = require('../common/log')
const { blank } = require('../common/util')

module.exports = {
  exif(buffer, offset = 0) {
    let data = {}

    if (!blank(buffer)) {
      try {
        while (offset < buffer.length) {
          if (buffer[offset++] === 0xFF && buffer[offset++] === 0xE1) {
            let meta = parse(buffer.slice(offset + 2))

            data = ({
              ...meta.gps, ...meta.exif, ...meta.image
            })

            break
          }
        }
      } catch (error) {
        verbose(`EXIF extraction failed: ${error.message}`)
        debug(error.stack)
      }
    }

    return data
  }
}
