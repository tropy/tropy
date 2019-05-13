'use strict'

const { join } = require('path')
const app = join(__dirname, '..')

module.exports = {
  app,

  res(...args) {
    return join(app, 'res', ...args)
  },

  styles(...args) {
    return join(app, 'lib', 'stylesheets', ...args)
  },

  user(...args) {
    return join(ARGS.data, ...args)
  }
}
