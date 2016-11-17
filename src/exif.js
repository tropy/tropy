'use strict'

const parse = require('exif-reader')
const { verbose } = require('./common/log')

module.exports = {
  exif(buffer) {
    return new Promise((resolve) => {
      try {
        let offset = 0

        while (offset < buffer.length) {
          if (buffer[offset++] === 0xFF && buffer[offset++] === 0xE1) {
            resolve(parse(buffer.slice(offset + 2)))
            break
          }
        }

      } catch (error) {
        verbose(`EXIF extraction failed: ${error.message}`)
        resolve({})
      }
    })
  }
}
