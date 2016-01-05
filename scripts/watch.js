'use strict'

require('shelljs/make')

const gaze = require('gaze')
const colors = require('colors/safe')
const path = require('path')

const make = require('./make')
const log = require('./log')
const cwd = process.cwd()

const COLORS = { changed: 'blue', deleted: 'red', added: 'green' }

function colorize(event, text) {
  return colors[COLORS[event] || 'white'](text)
}

function shorten(file) {
  return path.relative(cwd, file)
}

target.all = () => {
  target.src()
}

target.src = () => {
  const tag = 'watch:src'

  gaze('src/**/*.{js,jsx}', function (err) {
    if (err) return log.error(err, { tag })

    this.on('all', (event, file) => {
      log.info(colorize(event, shorten(file)), { tag })

      if (event === 'deleted') {
        return rm(file)
      }

      make['compile:js'](file)
    })
  })
}
