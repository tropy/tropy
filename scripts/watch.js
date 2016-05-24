'use strict'

require('shelljs/make')

const chokidar = require('chokidar')
const colors = require('colors/safe')
const { relative, extname, basename } = require('path')

const make = require('./make')
const log = require('./log')
const cwd = process.cwd()

const COLOR = { change: 'blue', unlink: 'red', add: 'green' }

function colorize(event, text) {
  return colors[COLOR[event] || 'white'](text)
}

function shorten(file) {
  return relative(cwd, file)
}

function mocha(spec, tag) {
  const args = (/browser|common/).test(spec) ?
    [spec] : ['--renderer', spec]

  make.mocha(args, true, (code, stdout) => {
    if (code === 0) {
      log.info(colors.green(spec), { tag })
    } else {
      log.error(colors.red(spec), { tag })
      process.stderr.write(stdout)
    }
  })
}


target.all = () => {
  target.src()
  target.test()
}

target.src = () => {
  const tag = 'watch:src'

  chokidar
    .watch('src/**/*.{js,jsx,scss,sass}', {
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

      if ((/^\.jsx?$/).test(extname(file))) {
        make['compile:js'](file)

        if (event === 'change') {
          const spec = file
            .replace(/^src/, 'test')
            .replace(/\.jsx?$/, '_test.js')

          if (test('-f', spec)) mocha(spec, tag)
        }

      } else {

        make['compile:css']((basename(file)[0] === '_') ? undefined : file)
      }
    })
}

target.test = () => {
  chokidar
    .watch('test/**/*_test.js', {
      persistent: true
    })
    .on('change', (file) => {
      mocha(shorten(file), 'watch:test')
    })
}
