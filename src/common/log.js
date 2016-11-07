'use strict'

const { Logger, transports } = require('winston')
const { join } = require('path')
const { assign } = Object

const ms = require('ms')
const pad = require('string.prototype.padstart')
const colors = require('colors/safe')
const symbol = (process.type === 'renderer') ? 'ρ' : 'β'

const PADDING = 8

const COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  verbose: 'magenta',
  debug: 'green'
}

const seq = timer()

const logger = new Logger({
  level: 'info',
  transports: []
})


function init(dir) {
  logger.clear()

  switch (ARGS.environment) {
    case 'development':
      logger.level = 'verbose'
      logger.add(transports.Console, {
        handleExceptions: true,
        humanReadableUnhandledException: true,
        formatter
      })
      // eslint-disable-line no-fallthrough

    case 'production':
      if (dir) {
        logger.add(transports.File, {
          filename: join(dir, `${process.type}.log`),
          maxsize: 1024 * 1024,
          maxFiles: 1,
          tailable: true,
          handleExceptions: true,
          humanReadableUnhandledException: true
        })
      }

      break

    case 'test':
      if (!process.env.CI) {
        logger.level = 'verbose'
        logger.add(transports.File, {
          filename: join(__dirname, '..', '..', 'tmp', 'test.log'),
          maxsize: 1024 * 1024,
          maxFiles: 1,
          tailable: true,
          handleExceptions: true,
          humanReadableUnhandledException: true,
        })
      }
      break
  }

  if (ARGS.debug) logger.level = 'debug'

  logger.debug('logger initialized at level %s', logger.level)

  return module.exports
}

function *timer() {
  for (let a = Date.now(), b;; a = b) {
    yield ((b = Date.now()), b - a)
  }
}

function time() {
  return colors.gray(pad(`+${ms(seq.next().value)}`, PADDING, ' '))
}

function colorize(level, string = level) {
  return colors[COLORS[level] || 'gray'](string)
}

function text(options) {
  let meta = assign({}, options.meta)
  let message = options.message

  if (meta.module) {
    message = `[${meta.module}] ${message}`
  }

  return message
}

function formatter(options) {
  return `${time()} ${colorize(options.level, symbol)} ${text(options)}`
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
