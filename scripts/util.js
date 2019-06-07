'use strict'

const chalk = require('chalk')
const ms = require('ms')

const COLOR = {
  warn: 'yellow',
  error: 'red',
  red: 'red',
  green: 'green',
  log: 'blue'
}

const colorize = (level, text) =>
  chalk[COLOR[level] || 'gray'](text || level)

const seq = (function * (prev = Date.now(), padding = 8) {
  while (true) {
    let now = Date.now()
    yield chalk.gray((`+${ms(now - prev)}`).padStart(padding, ' '))
    prev = now
  }
})()

const format = (msg, level, prefix) =>
  (prefix) ?
    `${seq.next().value} ${colorize(level, prefix)} ${msg}` :
    `  ${msg}`

const log = (...args) =>
  print('log', ...args)

const error = (...args) =>
  print('error', ...args)

const warn = (...args) =>
  print('warn', ...args)

const check = (predicate, prefix, msg = 'assertion failed', ...args) => {
  if (!predicate) bail(prefix, msg, ...args)
}

const bail = (...args) => {
  error(...args)
  process.exit(1)
}

const print = (level = 'log', pre, msg, ...args) => {
  console[level](format(msg, level, pre), ...args)
}

const red = (pre, msg, ...args) =>
  console.log(format(msg, 'red', pre), ...args)

const green = (pre, msg, ...args) =>
  console.log(format(msg, 'green', pre), ...args)


module.exports = (name) => ({
  check(predicate, ...args) {
    check(predicate, name, ...args)
  },

  say(...args) { log(name, ...args) },
  warn(...args) { warn(name, ...args) },
  error(...args) { error(name, ...args) },
  red(...args) { red(name, ...args) },
  green(...args) { green(name, ...args) }
})
