'use strict'

const { TYPE } = require('./constants')

const NUM = new Intl.NumberFormat(ARGS.locale, {
  maximumFractionDigits: 2
})

const size = {
  bytes: 1,
  kB: 1 << 10,
  MB: 1 << 20,
  GB: 1 << 30,
  TB: (1 << 30) * 1024
}

const format = {
  datetime(value) {
    try {
      return new Intl.DateTimeFormat(ARGS.locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }).format(value instanceof Date ? value : new Date(value))
    } catch (error) {
      return value
    }
  },

  number(value) {
    return NUM.format(value)
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

module.exports = format
