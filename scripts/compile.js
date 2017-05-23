'use strict'

require('shelljs/make')

const babel = require('babel-core')
const sass = require('node-sass')
const { Glob } = require('glob')
const { join, resolve, relative, dirname } = require('path')
const { statSync: stat } = require('fs')
const { check, error, say } = require('./util')('compile')
const home = resolve(__dirname, '..')

target.all = () =>
  Promise.all([js(), css()])

function js(pattern = 'src/**/*.{js,jsx}') {
  return new Promise((resolve, reject) => {
    new Glob(pattern)
      .on('end', resolve)
      .on('error', reject)

      .on('match', (file) => {
        let src = relative(home, file)
        let dst = swap(src, 'src', 'lib', '.js')

        check(src.startsWith('src'), 'not a src path')
        if (fresh(src, dst)) return

        say(dst)

        babel.transformFile(src, (err, result) => {
          if (err) return error(err)
          mkdir('-p', dirname(dst))
          result.code.to(dst)
        })
      })
  })
}

function css(pattern = 'src/stylesheets/**/!(_*).{sass,scss}') {
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

function fresh(src, dst) {
  try {
    return stat(dst).mtime > stat(src).mtime
  } catch (_) {
    return false
  }
}

function swap(filename, src, dst, ext) {
  return filename
    .replace(src, dst)
    .replace(/(\..+)$/, m => ext || m[1])
}

module.exports = {
  js, css
}
