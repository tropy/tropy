import { TYPE } from './constants'
import edtf from 'edtf'
import { blank } from './common/util'

export function datetime(value, options = DTF) {
  try {
    if (blank(value)) return value
    const date = (value instanceof Date) ? value : edtf(value)

    if (date.getUTCFullYear() < 1300) {
      options = { ...options, era: 'short' }
    }

    return edtf.format(date, ARGS.locale, options)

  } catch (error) {
    return value
  }
}

export function number(value) {
  return fmtNumber(value)
}

export function bytes(value) {
  if (typeof value === 'string') value = parseInt(value, 10)
  if (!Number.isFinite(value)) return null

  let mag = Math.abs(value)
  let unit = (mag >= size.TB) ?
      'TB' : (mag >= size.GB) ?
      'GB' : (mag >= size.MB) ?
      'MB' : (mag >= size.kB) ?
      'kB' : 'bytes'

  return `${number(value / size[unit])} ${unit}`
}

export function ppi(value) {
  return blank(value) ? value : `${number(value)} ppi`
}

export function auto(value, type) {
  switch (type) {
    case TYPE.DATE:
      return datetime(value)
    case TYPE.NUMBER:
      return number(value)
    default:
      return value
  }
}

function fmtNumber(value, locale = ARGS.locale) {
  if (!(locale in fmtNumber)) {
    fmtNumber[locale] =  new Intl.NumberFormat(locale, {
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
