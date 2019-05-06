'use strict'

require('shelljs/make')
config.fatal = false

const chokidar = require('chokidar')
const { relative, extname, basename } = require('path')
const compile = require('./compile')
const { error, green, red, say } = require('./util')('ω')
const cwd = process.cwd()
const debounce = require('lodash.debounce')

const css = debounce(compile.css, 500)

target.all = () => {
  target.src()
  target.test()
}

target.src = () => {
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
        compile.jsRender(file, true)

        if (event === 'change') {
          const spec = file
            .replace(/^src/, 'test')
            .replace(/\.jsx?$/, '_test.js')

          if (test('-f', spec)) mocha(spec)
        }

      } else {
        if ((basename(file)[0] === '_')) css()
        else compile.cssRender(file, true)
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

function mocha(file) {
  let args = (/browser|common/).test(file) ?
    [file] : ['--renderer', file]

  let result = exec(`npx electron-mocha ${args.join(' ')}`, { silent: true })
  if (result.code === 0) {
    green(file)
  } else {
    red(file)
    console.log(result.stdout)
  }
}
