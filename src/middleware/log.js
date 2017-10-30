'use strict'

const { warn, log } = require('../common/log')
const { gray } = require('colors/safe')
const ms = require('ms')

function format(type, meta) {
  return (meta.rel) ?
    `${type} ${gray(`#${meta.seq}(${meta.rel}) Δ${ms(meta.now - meta.was)}`)}` :
    `${type} ${gray('#' + meta.seq)}`
}

module.exports = {
  log() {
    return next => action => {
      const { type, payload, meta, error } = action

      switch (true) {
        case !!error:
          warn(`${type} failed: ${payload.message}`, { error: payload, meta })
          break
        default:
          log(meta.log || 'verbose', format(type, meta))
      }

      return next(action)
    }
  }
}
