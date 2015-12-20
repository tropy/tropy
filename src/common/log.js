'use strict'

const { Logger, transports } = require('winston')
const logger = new Logger({
  level: 'info',
  transports: []
})


switch (process.env.NODE_ENV) {
  case 'development':
    logger.level = 'verbose'
    logger.transports.push(new transports.Console())
    break

  case 'production':
    break

  case 'test':
    logger.transports.push(new transports.Memory())
    break
}

module.exports = {
  logger,

  log: logger.log.bind(logger),
  debug: logger.debug.bind(logger),
  verbose: logger.verbose.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger)
}
