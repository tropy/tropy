'use strict'

const pino = require('pino')
let instance

function logRotate(file, suffix = '.1') {
  try {
    const fs = require('fs')
    fs.copyFileSync(file, file + suffix)
    fs.truncateSync(file)
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
}

function log({
  dest = 2,
  level,
  name = 'log',
  rotate = false,
  debug = process.env.TROPY_DEBUG,
  trace = process.env.TROPY_TRACE
} = {}) {

  if (!level && trace) level = 'trace'
  if (!level && debug) level = 'debug'

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

  if (rotate && typeof dest === 'string') {
    logRotate(dest)
  }

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
    log.instance.fatal(...args)
  },
  error(...args) {
    log.instance.error(...args)
  },
  warn(...args) {
    log.instance.warn(...args)
  },
  info(...args) {
    log.instance.info(...args)
  },
  debug(...args) {
    log.instance.debug(...args)
  },
  trace(...args) {
    log.instance.trace(...args)
  }
})
