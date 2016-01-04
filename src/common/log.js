'use strict'

const { Logger, transports } = require('winston')
const { join } = require('path')
const { assign } = Object

const logger = new Logger({
  level: 'info',
  transports: []
})


function init(dir, environment = process.env.NODE_ENV) {
  logger.clear()

  switch (environment) {
    case 'development':
      logger.level = 'verbose'
      logger.add(transports.Console, {
        colorize: true
      })
      // eslint-disable-line no-fallthrough

    case 'production':
      if (dir) {
        logger.add(transports.File, {
          filename: join(dir, `${process.type}.log`),
          maxsize: 1024 * 1024,
          maxFiles: 5,
          tailable: true,
          handleExceptions: true,
          humanReadableUnhandledException: true
        })
      }

      break


    case 'test':
      logger.add(transports.Memory)
      break
  }

  return module.exports
}


module.exports = assign(init, {
  logger,

  query: logger.query.bind(logger),
  profile: logger.profile.bind(logger),
  log: logger.log.bind(logger),
  debug: logger.debug.bind(logger),
  verbose: logger.verbose.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger)
})
