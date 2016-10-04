'use strict'

const { debug, warn, verbose } = require('../common/log')

function format(type, meta) {
  return `${type} #${meta.seq}` + (meta.rel ? `(${meta.rel})` : '')
}

module.exports = {
  log() {
    return next => action => {
      const { type, payload, meta, error } = action

      switch (true) {
        case !!error:
          warn(`${format(type, meta)} failed: ${payload.message}`)
          debug(payload.message, payload.stack)
          break
        default:
          verbose(format(type, meta), { payload, meta })
      }

      return next(action)
    }
  }
}
