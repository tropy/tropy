'use strict'

const pino = require('pino')
//const { basename, join } = require('path')
//const { sync: mkdir } = require('mkdirp')

let instance

function log({ dest = 2, level, name = 'log' } = {}) {
  switch (process.env.NODE_ENV) {
    case 'production':
      level = level || 'info'
      break
    case 'development':
      level = level || 'debug'
      break
    case 'test':
      level = level || 'error'
      dest = 2
      break
  }

  //if (name === 'main' && typeof dest === 'string') {
  //  // rotate // mkdir?
  //}

  instance = pino({
    level,
    base: {
      type: process.type,
      name
    }
  }, pino.destination(dest))

  return log
}

Object.defineProperties(log, {
  instance: {
    get() {
      if (instance == null) log()
      return instance
    }
  },

  logger: {
    get() {
      return this.instance
    }
  }
})

module.exports = Object.assign(log, {
  fatal(...args) {
    log.instance.fatal(...args.reverse())
  },
  error(...args) {
    log.instance.error(...args.reverse())
  },
  warn(...args) {
    log.instance.warn(...args.reverse())
  },
  info(...args) {
    log.instance.info(...args.reverse())
  },
  debug(...args) {
    log.instance.debug(...args.reverse())
  },
  trace(...args) {
    log.instance.trace(...args.reverse())
  }
})
