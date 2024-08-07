import { logger } from '../common/log.js'

export function log() {
  return next => action => {
    const { type, payload, meta, error } = action

    switch (true) {
      case !!error:
        logger.warn({
          action: type,
          meta,
          msg: `${type} failed: ${error.message || payload?.message}`,
          stack: error.stack || payload?.stack
        })
        break
      default:
        if (meta.log !== false) {
          logger[meta.log || 'debug']({
            action: type,
            meta,
            payload: logger.level === 'trace' ?
              payload : undefined
          })
        }
    }

    return next(action)
  }
}
