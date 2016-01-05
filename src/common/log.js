'use strict'

const { Logger, transports } = require('winston')
const { join } = require('path')
const { inspect } = require('util')
const { assign } = Object

const ms = require('ms')
const pad = require('string.prototype.padstart')
const colors = require('colors/safe')
const symbol = (process.type === 'renderer') ? 'ρ' : 'β'

const COLORS = { info: 'blue', warn: 'yellow', error: 'red', debug: 'magenta' }
const seq = timer()

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

function *timer() {
  for (let a = Date.now(), b;; a = b) {
    yield ((b = Date.now()), b - a)
  }
}

function time() {
  return colors.gray(pad(`+${ms(seq.next().value)}`, 8, ' '))
}

function colorize(level, string = level) {
  return colors[COLORS[level] || 'gray'](string)
}

function text(options) {
  if (!options.meta) return options.message
  return [options.message, inspect(options.meta)].join(' ')
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
