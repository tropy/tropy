'use strict'

const { TYPE } = require('./constants')
const edtf = require('edtf')
const { blank } = require('./common/util')

const format = {
  datetime(value, options = DTF) {
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
  },

  number(value) {
    return fmtNumber(value)
  },

  bytes(value) {
    if (typeof value === 'string') value = parseInt(value, 10)
    if (!Number.isFinite(value)) return null

    let mag = Math.abs(value)
    let unit = (mag >= size.TB) ?
        'TB' : (mag >= size.GB) ?
        'GB' : (mag >= size.MB) ?
        'MB' : (mag >= size.kB) ?
        'kB' : 'bytes'

    return `${format.number(value / size[unit])} ${unit}`
  },

  auto(value, type) {
    switch (type) {
      case TYPE.DATE:
        return format.datetime(value)
      default:
        return value
    }
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

module.exports = format
