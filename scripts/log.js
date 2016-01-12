'use strict'

const winston = require('winston')

const colors = require('colors/safe')
const pad = require('string.prototype.padstart')

const COLOR = { warn: 'yellow', error: 'red' }

function colorize(level, text) {
  return colors[COLOR[level] || 'gray'](text || level)
}

function prefix(options) {
  return colorize(options.level, pad(options.meta.tag || '', 12, ' '))
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
