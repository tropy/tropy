'use strict'

const { debug, warn, verbose } = require('../common/log')
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
          warn(`${format(type, meta)} failed: ${payload.message}`)
          debug(payload.message, payload.stack)
          break
        default:
          verbose(format(type, meta), { payload, meta })
      }

      return next(action)
    }
  }
}
