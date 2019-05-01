'use strict'

const { Logger, transports } = require('winston')
const { basename, join } = require('path')
const { assign } = Object
const { system } = require('./os')
const { version } = require('./release')
const { sync: mkdir } = require('mkdirp')

const ms = require('ms')
const colors = require('colors/safe')

const [SYMBOL, LABEL] = (process.type === 'renderer') ?
  ['ρ', `${basename(window.location.pathname, '.html')}`] :
  ['β', 'main']

const PADDING = 8

const COLORS = {
  fatal: 'red',
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  debug: 'green',
  trace: 'magenta'
}

const seq = timer()

const logger = new Logger({
  level: 'info',
  transports: []
})


function init(dir, {
  debug,
  environment,
  locale
} = {}) {
  logger.clear()
  if (debug) logger.level = 'debug'

  switch (environment) {
    case 'development':
      logger.add(transports.Console, {
        handleExceptions: false,
        formatter
      })
      // eslint-disable-next-line no-fallthrough
    case 'production':
      if (dir) {
        mkdir(dir)
        logger.add(transports.File, {
          label: LABEL,
          filename: join(dir, `${LABEL}.log`),
          handleExceptions: false,
          options: { flags: 'w' }
        })
      }
      break
    case 'test':
      logger.add(transports.Console, {
        handleExceptions: true,
        humanReadableUnhandledException: true
      })
      logger.level = 'debug'
      break
  }

  logger.info(`log.init ${version}`, {
    dpx: global.devicePixelRatio,
    environment,
    locale,
    system,
    version
  })

  return module.exports
}

function *timer() {
  for (let a = Date.now(), b;; a = b) {
    yield ((b = Date.now()), b - a)
  }
}

function time() {
  return colors.gray((`+${ms(seq.next().value)}`).padStart(PADDING, ' '))
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
  log: logger.log.bind(logger),
  fatal: logger.error.bind(logger),
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  info: logger.info.bind(logger),
  debug: logger.debug.bind(logger),
  trace: logger.silly.bind(logger)
})
