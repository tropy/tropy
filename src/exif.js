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
            const data = parse(buffer.slice(offset + 2))

            resolve({
              ...data.gps, ...data.exif, ...data.image
            })

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
