'use strict'

const { app } = require('electron')
const { join } = require('path')

module.exports = function (dir) {
  if (dir) return app.setPath('userData', dir)

  switch (process.env.NODE_ENV) {
    case 'development':
      app.setPath('userData', join(process.cwd(), 'tmp'))
      break
  }
}
