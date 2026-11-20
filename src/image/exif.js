import { debug, warn } from '../common/log.js'
import parse from '@inukshuk/exif'
import { blank } from '../common/util.js'
import { text, date } from '../value.js'
import { exif as ns } from '../ontology/ns.js'

const DEFAULTS = {
  strict: false,
  thumbnail: false,
  printImageMatching: false,
  interoperability: false
}

const DATES = [ns.dateTime, ns.dateTimeOriginal, ns.dateTimeDigitized]

// EXIF dates are local times.
// They have an offset only if the image has an offset time tag.
// Otherwise we assume the local timezone at that date or UTC.
function toDate (value, localtime) {
  if ((/[+-]\d{2}:\d{2}$/).test(value))
    return date(value)

  if (!localtime)
    return date(`${value}Z`)

  let offset = -new Date(value).getTimezoneOffset()
  let hh = String(Math.trunc(Math.abs(offset) / 60)).padStart(2, '0')
  let mm = String(Math.abs(offset) % 60).padStart(2, '0')

  return date(`${value}${offset < 0 ? '-' : '+'}${hh}:${mm}`)
}

export function exif (buffer, { localtime, ...opts } = {}) {
  if (!blank(buffer)) {
    try {
      let ifd = parse(buffer, { ...DEFAULTS, ...opts })
      if (ifd.errors) {
        debug({
          err: {
            stack: ifd.errors.map(e => [e.offset, e.message])
          }
        }, 'EXIF extraction errors')
      }

      let tags = ifd.flatten(true)

      for (let key in tags) {
        tags[key] = (DATES.includes(key) && typeof tags[key] === 'string')
          ? toDate(tags[key], localtime)
          : text(String(tags[key]))
      }

      return tags

    } catch (err) {
      warn({ err }, 'EXIF extraction failed')
    }
  }
}
