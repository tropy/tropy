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
      file = shorten(file)

      if (event === 'error') {
        return log.error(file, { tag })
      }

      log.info(colorize(event, file), { tag })

      if (event === 'unlink') {
        return rm(file.replace(/^src/, 'lib'))
      }

      make['compile:js'](file)

      if (event === 'change') {
        const spec = file
          .replace(/^src/, 'test')
          .replace(/\.jsx?$/, '_test.js')

        if (test('-f', spec)) {
          const args = (/browser/).test(spec) ?
            [spec] : ['--renderer' , spec]

          make.mocha(args, true, (code, stdout) => {
            if (code === 0) {
              log.info(colors.green(spec), { tag })
            } else {
              log.error(colors.red(spec), { tag })
              process.stderr.write(stdout)
            }
          })
        }
      }
    })
}
