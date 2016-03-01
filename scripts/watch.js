'use strict'

require('shelljs/make')

const chokidar = require('chokidar')
const colors = require('colors/safe')
const path = require('path')

const make = require('./make')
const log = require('./log')
const cwd = process.cwd()

const COLOR = { change: 'blue', unlink: 'red', add: 'green' }

function colorize(event, text) {
  return colors[COLOR[event] || 'white'](text)
}

function shorten(file) {
  return path.relative(cwd, file)
}

target.all = () => {
  target.src()
}

target.src = () => {
  const tag = 'watch:src'

  chokidar
    .watch('src/**/*.{js,jsx}', {
      persistent: true
    })

    .on('all', (event, file) => {
      if (event === 'error') {
        return log.error(shorten(file), { tag })
      }

      log.info(colorize(event, shorten(file)), { tag })

      if (event === 'unlink') {
        return rm(shorten(file).replace(/^src/, 'lib'))
      }

      make['compile:js'](file)
    })
}
