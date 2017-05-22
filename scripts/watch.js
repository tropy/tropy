'use strict'

require('shelljs/make')

const chokidar = require('chokidar')
const { relative, extname, basename } = require('path')

const make = require('./make')
const sass = require('./sass')
const babel = require('./babel')
const { error, green, red, say } = require('./util')('watch')
const cwd = process.cwd()

function mocha(spec) {
  const args = (/browser|common/).test(spec) ?
    [spec] : ['--renderer', spec]

  make.mocha(args, true, (code, stdout) => {
    if (code === 0) {
      green(spec)
    } else {
      error(spec)
      process.stderr.write(stdout)
    }
  })
}


target.all = () => {
  target.src()
  target.test()
}

target.src = () => {
  process.env.TROPY_RUN_UNIT_TESTS = 'true'

  chokidar
    .watch('src/**/*.{js,jsx,scss,sass}', {
      persistent: true
    })
    .on('all', (event, file) => {
      file = relative(cwd, file)

      switch (event) {
        case 'change':
          say(file)
          break
        case 'add':
          green(file)
          break
        case 'unlink':
          red(file)
          rm(file.replace(/^src/, 'lib'))
          return
        case 'error':
          error(file)
          return
      }

      if ((/^\.jsx?$/).test(extname(file))) {
        babel.transform(file)

        if (event === 'change') {
          const spec = file
            .replace(/^src/, 'test')
            .replace(/\.jsx?$/, '_test.js')

          if (test('-f', spec)) mocha(spec)
        }

      } else {
        if ((basename(file)[0] === '_')) sass.compile()
        else sass.compile(file)
      }
    })
}

target.test = () => {
  chokidar
    .watch('test/**/*_test.js', {
      persistent: true
    })
    .on('change', (file) => {
      mocha(relative(cwd, file))
    })
}
