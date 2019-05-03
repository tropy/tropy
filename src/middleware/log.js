'use strict'

const { logger } = require('../common/log')

module.exports = {
  log() {
    return next => action => {
      const { type, payload, meta, error } = action

      switch (true) {
        case !!error:
          logger.warn({
            action: type,
            meta,
            stack: payload.stack,
          }, `${type} failed: ${payload.message}`)
          break
        default:
          logger[meta.log || 'debug']({
            action: type,
            meta
          })
      }

      return next(action)
    }
  }
}
