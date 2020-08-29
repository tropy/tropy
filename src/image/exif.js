import { debug, warn } from '../common/log'
import parse from '@inukshuk/exif'
import { blank } from '../common/util'
import { text, date } from '../value'

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

export function exif(buffer, opts = {}) {
  if (!blank(buffer)) {
    try {
      let ifd = parse(buffer, { ...DEFAULTS, ...opts })
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
