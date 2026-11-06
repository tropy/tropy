import { copyFileSync, truncateSync } from 'node:fs'
import { dirname } from 'node:path'
import pino from 'pino'
import { home, system } from './os.js'
import { version } from './release.js'

/*
 * Logging Guidelines
 *
 * Users send logs recorded at info level,
 * debug if they enable developer mode,
 * so logs should let us reconstruct what happened
 * while staying short and free of user content.
 *
 * Messages: short, lowercase descriptions of the event.
 *
 * Common fields:
 *   err      the Error; don't repeat its message in `msg`
 *   path     the absolute file or folder; `src` and `dest` for two
 *   url
 *   ms       durations
 *
 *   project, item, photo, selection, note, etc.
 *            ids, never whole objects
 *
 *   module   sub-system: account, esper, watch, etc.
 *   counts   plural nouns with numbers (files, removed, items)
 *   sql
 *   status   HTTP status codes only
 *
 * Levels:
 *   fatal    crashes
 *   error    failed operations the user started
 *   warn     recoverable failures
 *   info     lifecycle and outcomes: app, windows, projects,
 *            imports, maintenance, updates
 *   debug    details of each operation: db connections, actions,
 *            api requests, slow queries
 *   trace    high-volume output
 *
 * Privacy: never log credentials. Above debug, avoid all user content
 * (search terms, notes, metadata, action payloads) or identifiers
 * like usernames. Debug may add identifiers, trace anything.
 *
 * The home folder in paths is shortened automatically.
 */

export let logger

const REDACT = [
  'headers.authorization',
  '*.headers.authorization'
]

export function redactHome (dir = home) {
  if (!dir || dirname(dir) === dir)
    return (s) => s

  let escaped = JSON.stringify(dir).slice(1, -1)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  let pattern = new RegExp(String.raw`${escaped}(?=/|\\\\|")`, 'g')

  return (s) => s.replace(pattern, '~')
}

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'short',
  timeStyle: 'short'
})

export function formatTime (ts) {
  return dateTimeFormat.format(new Date(ts))
}

function logRotate (file, suffix = '.1') {
  try {
    copyFileSync(file, file + suffix)
    truncateSync(file)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}

export function createLogger ({
  dest = 2,
  level,
  name = 'log',
  redact = REDACT,
  rotate = false,
  debug = process.env.TROPY_DEBUG,
  trace = process.env.TROPY_TRACE,
  test = process.env.NODE_ENV === 'test'
} = {}) {

  level ??= (trace) ? 'trace' : (debug) ? 'debug' : (test) ? 'error' : 'info'

  if (rotate && typeof dest === 'string') {
    logRotate(dest)
  }

  logger = pino({
    level,
    redact,
    hooks: {
      streamWrite: redactHome()
    },
    base: {
      type: process.type,
      name
    }
  }, pino.destination(dest))

  return logger
}

export function fatal (...args) {
  logger.fatal(...args)
}

export function error (...args) {
  logger.error(...args)
}

export function warn (...args) {
  logger.warn(...args)
}

export function info (...args) {
  logger.info(...args)
}

export function debug (...args) {
  logger.debug(...args)
}

export function trace (...args) {
  logger.trace(...args)
}

export function crashReport (err, msg) {
  try {
    return JSON.stringify({
      msg: msg || `unhandled error: ${err.message}`,
      stack: err.stack,
      system,
      time: Date.now(),
      version
    })
  } catch (_) {
    return JSON.stringify({
      stack: (err || _).stack
    })
  }
}
