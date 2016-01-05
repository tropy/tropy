'use strict'

const winston = require('winston')

const colors = require('colors/safe')
const pad = require('string.prototype.padstart')

const COLORS = { info: 'cyan', warn: 'yellow', error: 'red' }

function colorize(level, text) {
  return colors[COLORS[level] || 'gray'](text || level)
}

function prefix(options) {
  return pad(colorize(options.level, options.meta.tag), 19, ' ')
}

module.exports = new winston.Logger({
  transports: [
    new winston.transports.Console({
      formatter(options) {
        return `${prefix(options)} ${options.message}`
      }
    })
  ]
})
