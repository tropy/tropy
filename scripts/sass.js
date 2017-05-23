'use strict'

require('shelljs/make')

const sass = require('node-sass')
const { Glob } = require('glob')
const { join, resolve, relative, dirname } = require('path')
const { check, error, say, swap } = require('./util')('sass')
const home = resolve(__dirname, '..')

target.all = async (args = []) => {
  await compile(...args)
}


function compile(pattern = 'src/stylesheets/**/!(_*).{sass,scss}') {
  return new Promise((resolve, reject) => {
    new Glob(pattern)
      .on('end', resolve)
      .on('error', reject)

      .on('match', (file) => {
        let src = relative(home, file)
        let dst = swap(src, 'src', 'lib', '.css')

        check(src.startsWith(join('src', 'stylesheets')))
        say(dst)

        let options = {
          file: src,
          functions: SassExtensions,
          includePaths: SassIncludePath,
          outFile: dst,
          outputStyle: 'compressed',
          sourceMap: true
        }

        sass.render(options, (err, result) => {
          if (err) return error(`${err.line}: ${err.message}`)

          mkdir('-p', dirname(dst))
          String(result.css).to(dst)
          String(result.map).to(`${dst}.map`)
        })
      })
  })
}

const SassIncludePath = [
  join(home, 'node_modules')
]

const SassExtensions = {
  'const($name, $unit:"")'(name, unit) {
    const SASS = require('../src/constants/sass')
    const { get } = require('../src/common/util')

    const value = get(SASS, name.getValue())
    unit = unit.getValue()

    if (typeof value === 'number') {
      return new sass.types.Number(value, unit)
    }

    if (Array.isArray(value)) {
      return value.reduce((list, val, i) => (
        list.setValue(i, new sass.types.Number(val, unit)), list
      ), new sass.types.List(value.length))
    }

    return sass.types.Null.NULL
  }
}

module.exports = {
  compile
}
