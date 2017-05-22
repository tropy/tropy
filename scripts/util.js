'use strict'

const colors = require('colors/safe')
const ms = require('ms')
const pad = require('string.prototype.padstart')

const COLOR = {
  warn: 'yellow',
  error: 'red',
  red: 'red',
  green: 'green',
  log: 'blue'
}


function colorize(level, text) {
  return colors[COLOR[level] || 'gray'](text || level)
}

function *timer() {
  let a = Date.now()
  let b

  while (true) {
    b = Date.now()
    yield b - a
    a = b
  }
}

const seq = timer()

function time({ value }, padding = 8) {
  return colors.gray(pad(`+${ms(value)}`, padding, ' '))
}

function format(msg, level, pre) {
  return (pre) ?
    `${time(seq.next())} ${colorize(level, pre)} ${msg}` :
    `  ${msg}`
}

function log(...args) {
  print('log', ...args)
}

function error(...args) {
  print('error', ...args)
}

function warn(...args) {
  print('warn', ...args)
}

function check(predicate, pre, msg = 'assertion failed', ...args) {
  if (!predicate) bail(pre, msg, ...args)
}

function bail(...args) {
  error(...args)
  exit(1)
}

function print(level = 'log', pre, msg, ...args) {
  console[level](format(msg, level, pre), ...args)
}

function red(pre, msg, ...args) {
  console.log(format(msg, 'red', pre), ...args)
}

function green(pre, msg, ...args) {
  console.log(format(msg, 'green', pre), ...args)
}



module.exports = function (name) {
  return {
    check(predicate, ...args) {
      check(predicate, name, ...args)
    },

    rules(target) {
      for (let rule in target) log(false, `-> ${rule}`)
    },

    say(...args) { log(name, ...args) },
    warn(...args) { warn(name, ...args) },
    error(...args) { error(name, ...args) },
    red(...args) { red(name, ...args) },
    green(...args) { green(name, ...args) }
  }
}
