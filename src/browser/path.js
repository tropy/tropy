'use strict'

const { app } = require('electron')
const { join } = require('path')
const { channel, product } = require('../common/release')
const { downcase, titlecase } = require('../common/util')

module.exports = function (dir) {
  if (dir) return app.setPath('userData', dir)

  switch (process.env.NODE_ENV) {
    case 'development':
      app.setPath('userData', join(process.cwd(), 'tmp'))
      break

    case 'production': {
      let name = product

      if (channel !== 'stable') {
        name = `${name} ${titlecase(channel)}`
      }

      if (process.platform === 'linux') {
        name = downcase(name)
      }

      app.setPath('userData', join(app.getPah('appData'), name))
      break
    }

  }
}
