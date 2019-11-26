#!/usr/bin/env node

'use strict'

const babel = require('@babel/core')
const sass = require('node-sass')
const { Glob } = require('glob')
const { join, relative, dirname } = require('path')
const {
  mkdirSync: mkdir,
  statSync: stat,
  writeFileSync: write
} = require('fs')
const { check, error, say } = require('./util')('λ')
const noop = () => {}

const HOME = join(__dirname, '..')

const js = (pattern = 'src/**/*.{js,jsx}') =>
  new Promise((resolve, reject) => {
    say('compile javascripts...')
    new Glob(pattern)
      .on('end', resolve)
      .on('error', reject)
      .on('match', (file) => {
        let src = relative(HOME, file)
        check(src.startsWith('src'), 'not a src path')

        jsRender(src)
          .catch((reason) => { error(reason) })
      })
  })

const jsRender = (src, verbose = false, force = false) =>
  new Promise((resolve, reject) => {
    let dst = swap(src, 'src', 'lib', '.js')
    if (force || !fresh(src, dst)) {
      if (verbose) say(dst)
      babel.transformFile(src, (err, result) => {
        if (err) return reject(err)
        mkdir(dirname(dst), { recursive: true })
        write(dst, result.code, 'utf-8')
      })
    } else {
      resolve()
    }
  })

const css = (pattern = 'src/stylesheets/**/!(_*).{sass,scss}') =>
  new Promise((resolve, reject) => {
    say('compile stylesheets...')
    new Glob(pattern)
      .on('end', resolve)
      .on('error', reject)
      .on('match', (file) => {
        let src = relative(HOME, file)
        check(src.startsWith(join('src', 'stylesheets')))

        cssRender(src)
          .catch(({ line, message }) => {
            error(`${line}: ${message}`)
          })
      })
  })

const cssRender = (file, verbose = false, opts = SassDefaults) =>
  new Promise((resolve, reject) => {
    let outFile = swap(file, 'src', 'lib', '.css')
    if (verbose) say(outFile)
    sass.render({ ...opts, file, outFile }, (err, result) => {
      if (err) return reject(err)
      mkdir(dirname(outFile), { recursive: true })
      write(outFile, result.css, 'utf-8')
      write(`${outFile}.map`, result.map, 'utf-8')
    })
  })


const SassDefaults = {
  includePaths: [
    join(HOME, 'node_modules')
  ],

  functions: {
    'const($name, $unit:"")'(name, unit) {
      const SASS = require('../src/constants/sass')
      const { get } = require('../src/common/util')
      return toSass(get(SASS, name.getValue()), unit.getValue())
    }
  },

  outputStyle: 'compressed',
  sourceMap: true
}

const toSass = (value, unit) => {
  if (typeof value === 'number') {
    return new sass.types.Number(value, unit)
  }

  if (typeof value === 'string') {
    return new sass.types.String(value)
  }

  if (value != null && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.reduce((list, val, i) => (
        list.setValue(i, toSass(val, unit)), list
      ), new sass.types.List(value.length))
    }

    const entries = Object.entries(value)
    return entries.reduce((map, [key, val], i) => {
      map.setKey(i, new sass.types.String(key))
      map.setValue(i, toSass(val))
      return map
    }, new sass.types.Map(entries.length))
  }

  return sass.types.Null.NULL
}

const fresh = (src, dst) => {
  try {
    return stat(dst).mtime > stat(src).mtime
  } catch (_) {
    return false
  }
}

const swap = (filename, src, dst, ext) =>
  filename
    .replace(src, dst)
    .replace(/(\..+)$/, m => ext || m[1])

if (require.main === module) {
  require('yargs')
    .command('*', 'compile js and css', noop, () => {
      css()
      js()
    })
    .command('js [glob]', 'compile js', noop, opts => {
      js(opts.glob)
    })
    .command('css [glob]', 'compile css', noop, opts => {
      css(opts.glob)
    })
    .help()
    .argv
}

module.exports = {
  js,
  jsRender,
  css,
  cssRender
}
