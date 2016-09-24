'use strict'

const { seq, map } = require('transducers.js')
const handles = map(([, cmd]) => [cmd.action, cmd])

module.exports = {

  ...seq(require('./list'), handles),

  handle(action, options) {
    return new module.exports[action.type](action, options)
  }
}
