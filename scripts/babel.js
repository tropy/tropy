'use strict'

require('shelljs/make')

const babel = require('babel-core')
const { Glob } = require('glob')
const { resolve, relative, dirname } = require('path')
const { statSync: stat } = require('fs')
const { check, error, say, swap } = require('./util')('babel')
const home = resolve(__dirname, '..')

target.all = async (args = []) => {
  await transform(...args)
}

function transform(pattern = 'src/**/*.{js,jsx}') {
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

function fresh(src, dst) {
  try {
    return stat(dst).mtime > stat(src).mtime
  } catch (_) {
    return false
  }
}


module.exports = {
  transform
}
