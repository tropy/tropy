'use strict'

const NUM = new Intl.NumberFormat(ARGS.locale)

const size = {
  bytes: 1,
  kB: 1 << 10,
  MB: 1 << 20,
  GB: 1 << 30,
  TB: (1 << 30) * 1024
}

const format = {
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
  }
}

module.exports = format
