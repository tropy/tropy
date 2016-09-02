'use strict'

const { debug, warn, verbose, log } = require('../common/log')

module.exports = {
  log() {
    return next => action => {
      const { type, payload, meta, error } = action

      switch (true) {
        case (type === undefined):
          break
        case !!(meta && meta.log):
          log(meta.log, type, payload)
          break
        case !!error:
          warn(`${type} failed: ${payload.message}`)
          debug(payload)
          break
        default:
          verbose(type)
          debug({ payload, meta, error })
      }

      return next(action)
    }
  }
}
