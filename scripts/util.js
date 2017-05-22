'use strict'

const colors = require('colors/safe')
const ms = require('ms')
const pad = require('string.prototype.padstart')
const COLOR = { warn: 'yellow', error: 'red', default: 'blue' }


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

module.exports = function (name) {
  let fmt = (msg, level = 'default') =>
    `${time(seq.next())} ${colorize(level, name)} ${msg}`

  let util = {
    check(predicate, msg = 'assertion failed', ...args) {
      if (!predicate) util.bail(msg, ...args)
    },

    print(...args) {
      console.log(...args)
    },

    rules(target) {
      for (let rule in target) util.print(`  -> ${rule}`)
    },

    say(msg, ...args) {
      console.log(fmt(msg), ...args)
    },

    warn(msg, ...args) {
      console.warn(fmt(msg, 'warn'), ...args)
    },

    error(msg, ...args) {
      console.error(fmt(msg, 'error'), ...args)
    },

    bail(...args) {
      util.error(...args)
      exit(1)
    }
  }

  return util
}
