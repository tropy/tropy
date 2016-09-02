'use strict'

const { debug, warn, verbose } = require('../common/log')

module.exports = {
  log() {
    return next => action => {
      const { type, payload, meta, error } = action

      switch (true) {
        case (type === undefined):
          break
        case !!error:
          warn(`${type} failed: ${payload.message}`)
          debug(payload.message, payload.stack)
          break
        default:
          verbose(type)
          debug(type, { payload, meta, error })
      }

      return next(action)
    }
  }
}
