import { join } from 'node:path'
import { styleText } from 'node:util'
import ms from 'ms'

export const ROOT = join(import.meta.dirname, '..')
export const ICONS = join(ROOT, 'res', 'icons')

export let logSymbol = null
export const setLogSymbol = (ls) => {
  logSymbol = ls
}

const COLOR = {
  warn: 'yellow',
  error: 'red',
  red: 'red',
  green: 'green',
  log: 'blue'
}

const colorize = (level, text) =>
  styleText(COLOR[level] || 'gray', text || level)

const seq = (function * (prev = Date.now(), padding = 8) {
  while (true) {
    let now = Date.now()
    yield styleText('gray', (`+${ms(now - prev)}`).padStart(padding, ' '))
    prev = now
  }
})()

const format = (msg, level, prefix) =>
  (prefix) ?
    `${seq.next().value} ${colorize(level, prefix)} ${msg}` :
    `  ${msg}`

export const say = (...args) =>
  print('log', ...args)

export const error = (...args) =>
  print('error', ...args)

export const warn = (...args) =>
  print('warn', ...args)

export const check = (predicate, msg = 'assertion failed', ...args) => {
  if (!predicate) bail(msg, ...args)
}

export const bail = (...args) => {
  error(...args)
  process.exit(1)
}

const print = (level = 'log', msg, ...args) => {
  console[level](format(msg, level, logSymbol), ...args)
}

export const red = (msg, ...args) =>
  console.log(format(msg, 'red', logSymbol), ...args)

export const green = (msg, ...args) =>
  console.log(format(msg, 'green', logSymbol), ...args)
