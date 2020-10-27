import pino from 'pino'
import { system } from './os'
import { version } from './release'
import { copyFileSync, truncateSync } from 'fs'

export let logger

function logRotate(file, suffix = '.1') {
  try {
    copyFileSync(file, file + suffix)
    truncateSync(file)
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
}

export function createLogger({
  dest = 2,
  level,
  name = 'log',
  rotate = false,
  debug = process.env.TROPY_DEBUG, // eslint-disable-line no-shadow
  trace = process.env.TROPY_TRACE  // eslint-disable-line no-shadow
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

  logger = pino({
    level,
    base: {
      type: process.type,
      name
    }
  }, pino.destination(dest))

  return logger
}

export function fatal(...args) {
  logger.fatal(...args)
}

export function error(...args) {
  logger.error(...args)
}

export function warn(...args) {
  logger.warn(...args)
}

export function info(...args) {
  logger.info(...args)
}

export function debug(...args) {
  logger.debug(...args)
}

export function trace(...args) {
  logger.trace(...args)
}

export function crashReport(e, msg) {
  try {
    return JSON.stringify({
      msg: msg || `unhandled error: ${e.message}`,
      stack: e.stack,
      system,
      time: Date.now(),
      version
    })
  } catch (_) {
    return JSON.stringify({ stack: (e || _).stack })
  }
}
