import edtf, { format as edtfFormat } from 'edtf'
import ARGS from './args.js'
import { TYPE } from './constants/index.js'
import { blank } from './common/util.js'

export function datetime (value, options = DTF) {
  try {
    if (blank(value))
      return value

    let date = (value instanceof Date) ? value : edtf(value)

    if (date.getUTCFullYear() < 1300) {
      options = { ...options, era: 'short' }
    }

    return edtfFormat(date, ARGS.locale, options)

  } catch {
    return value
  }
}

export function number (value) {
  return fmtNumber(value)
}

export function bytes (value) {
  if (typeof value === 'string')
    value = parseInt(value, 10)
  if (!Number.isFinite(value))
    return null

  let mag = Math.abs(value)
  let unit = (mag >= size.TB) ?
      'TB' : (mag >= size.GB) ?
      'GB' : (mag >= size.MB) ?
      'MB' : (mag >= size.kB) ?
      'kB' : 'bytes'

  return `${number(value / size[unit])} ${unit}`
}

export function ppi (value) {
  return blank(value) ? value : `${number(value)} ppi`
}

export function auto (value, type) {
  switch (type) {
    case TYPE.DATE:
      return datetime(value)
    case TYPE.NUMBER:
      return number(value)
    case TYPE.BYTE:
      return bytes(value)
    case 'ppi':
      return ppi(value)
    default:
      return value
  }
}

// The matcher's (see common/matcher.js) ranges in the displayed
// metadata value (see auto). Values shown as they are match
// on what is shown. Formatted values match on their raw value,
// which is what the search indexes, and are marked as a whole.
export function ranges (value, type, matcher) {
  if (matcher == null || blank(value))
    return null

  let text = auto(value, type)

  if (blank(text))
    return null

  if (text === value)
    return matcher.ranges(value, 'metadata')

  return matcher.test(String(value), 'metadata') ?
    [[0, text.length]] :
    null
}

function fmtNumber (value, locale = ARGS.locale) {
  if (!(locale in fmtNumber)) {
    fmtNumber[locale] = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2
    })
  }

  return fmtNumber[locale].format(value)
}

const DTF = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric'
}

const size = {
  bytes: 1,
  kB: 1 << 10,
  MB: 1 << 20,
  GB: 1 << 30,
  TB: (1 << 30) * 1024
}
