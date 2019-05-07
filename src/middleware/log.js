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
            msg: `${type} failed: ${payload.message}`,
            stack: payload.stack
          })
          break
        default:
          if (meta.log !== false) {
            logger[meta.log || 'debug']({
              action: type,
              meta,
              // TODO log payload?
            })
          }
      }

      return next(action)
    }
  }
}
