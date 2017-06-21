'use strict'

const { Logger, transports } = require('winston')
const { basename, join } = require('path')
const { assign } = Object
const { sync: mkdir } = require('mkdirp')

const ms = require('ms')
const pad = require('string.prototype.padstart')
const colors = require('colors/safe')

const [SYMBOL, LABEL] = (process.type === 'renderer') ?
  ['ρ', `${basename(window.location.pathname, '.html')}`] :
  ['β', 'main']

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
      // eslint-disable-next-line no-fallthrough
    case 'production':
      if (dir) {
        mkdir(dir)
        logger.add(transports.File, {
          label: LABEL,
          filename: join(dir, `${LABEL}.log`),
          tailable: true,
          handleExceptions: true,
          humanReadableUnhandledException: true,
          options: { flags: 'w' }
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
  return `${time()} ${colorize(options.level, SYMBOL)} ${text(options)}`
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
