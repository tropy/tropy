'use strict'

const { Logger, transports } = require('winston')
const logger = new Logger({
  level: 'info',
  transports: []
})


function init(environment = process.env.NODE_ENV) {
  for (let tr of logger.transports) logger.remove(tr)

  switch (environment) {
    case 'production':
      break

    case 'development':
      logger.level = 'verbose'
      logger.add(transports.Console)
      break

    case 'test':
      logger.add(transports.Memory)
      break
  }

  return this
}


module.exports = Object.assign(init, {
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
