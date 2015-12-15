'use strict'

require('shelljs/make')

const gaze = require('gaze')
const make = require('./make')

target.all = () => {
  target.src()
}

target.src = () => {
  gaze('src/**/*.{js,jsx}', function (err) {
    if (err) return console.error(err)

    this.on('all', (event, file) => {
      console.log(event, file)

      if (event === 'deleted') {
        return rm(file)
      }

      make['compile-js'](file)
    })
  })
}
