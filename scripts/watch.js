'use strict'

require('shelljs/make')

const gaze = require('gaze')
const make = require('./make')
const log = require('winston').cli()

target.all = () => {
  target.src()
}

target.src = () => {
  gaze('src/**/*.{js,jsx}', function (err) {
    if (err) return log.error(err)

    this.on('all', (event, file) => {
      log.info(event, file)

      if (event === 'deleted') {
        return rm(file)
      }

      make['compile-js'](file)
    })
  })
}
