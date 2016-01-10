'use strict'

require('shelljs/make')

const assert = require('assert')
const path = require('path')
const fs = require('fs')
const babel = require('babel-core')
const glob = require('glob')
const sass = require('node-sass')
const log = require('./log')

const home = path.resolve(__dirname, '..')
const nbin = path.join(home, 'node_modules', '.bin')
const cov = path.join(home, 'coverage')
const scov = path.join(home, 'src-cov')

const mocha = path.join(nbin, 'electron-mocha')
const lint = path.join(nbin, 'eslint')
const istanbul = path.join(nbin, 'istanbul')

const electron = process.env.ELECTRON_PATH = require('electron-prebuilt')

const resources = (process.platform === 'darwin') ?
  path.resolve(electron, '..', '..', 'Resources') :
  path.resolve(electron, '..', 'resources')


target.lint = () => {
  exec(`${lint} --color src test static scripts`)
}


target.test = () => {
  target['lint']()
  target['test:browser']()
  target['test:renderer']()
}

target['test:renderer'] = (args) => {
  target.unlink()

  args = args || []
  args.unshift('--renderer')

  test(args.concat(
    glob.sync('test/**/*_test.js', { ignore: 'test/browser/*' })))
}

target['test:browser'] = (args) => {
  target.unlink()

  args = args || []
  test(args.concat(glob.sync('test/browser/**/*_test.js')))
}

target.mocha = (args) => test(args)


target.compile = () => {
  target['compile:js']()
  target['compile:css']()
}

target['compile:js'] = (pattern) => {
  const tag = 'compile:js'

  new glob
    .Glob(pattern || 'src/**/*.{js,jsx}')
    .on('error', (err) => log.error(err, { tag }))

    .on('match', (file) => {
      let src = path.relative(home, file)
      let dst = swap(src, 'src', 'lib', '.js')

      assert(src.startsWith('src'))
      if (fresh(src, dst)) return

      log.info(dst, { tag })

      babel.transformFile(src, (err, result) => {
        if (err) return log.error(err, { tag })

        mkdir('-p', path.dirname(dst))
        result.code.to(dst)
      })
    })
}

target['compile:css'] = (pattern) => {
  const tag = 'compile:css'

  new glob
    .Glob(pattern || 'src/stylesheets/**/!(_*).{sass,scss}')
    .on('error', (err) => log.error(err, { tag }))

    .on('match', (file) => {
      let src = path.relative(home, file)
      let dst = swap(src, 'src', 'lib', '.css')

      assert(src.startsWith(path.join('src', 'stylesheets')))
      log.info(dst, { tag })

      let options = {
        file: src,
        outFile: dst,
        outputStyle: 'compressed',
        sourceMap: true
      }

      sass.render(options, (err, result) => {
        if (err) return log.error(`${err.line}: ${err.message}`, { tag })

        mkdir('-p', path.dirname(dst))
        String(result.css).to(dst)
        String(result.map).to(`${dst}.map`)
      })
    })
}


target.cover = (args) => {
  const tag = 'cover'
  args = args || ['html']

  rm('-rf', cov)
  rm('-rf', scov)

  log.info('instrumenting source files...', { tag })
  exec(`${istanbul} instrument -o src-cov src`, { silent: true })

  target['test:browser'](['--reporter test/support/coverage'])
  mv(`${cov}/coverage-final.json`, `${cov}/coverage-browser.json`)

  target['test:renderer'](['--reporter test/support/coverage'])
  mv(`${cov}/coverage-final.json`, `${cov}/coverage-renderer.json`)

  log.info('writing coverage report...', { tag })
  exec(`${istanbul} report --root ${cov} ${args.join(' ')}`, { silent: true })

  rm('-rf', scov)
}

target.link = () => {
  ln('-sf', home, path.join(resources, 'app'))
}

target.unlink = () => {
  rm('-f', path.join(resources, 'app'))
}


target.rules = () => {
  for (let rule in target) log.info(rule, { tag: 'make' })
}


target.clean = () => {
  target.unlink()

  rm('-rf', path.join(home, 'lib'))
  rm('-rf', path.join(home, 'dist'))
  rm('-rf', cov)
  rm('-rf', scov)

  rm('-f', path.join(home, 'npm-debug.log'))
}


function fresh(src, dst) {
  try {
    return fs.statSync(dst).mtime > fs.statSync(src).mtime

  } catch (_) {
    return false
  }
}

function swap(filename, src, dst, ext) {
  return filename
    .replace(src, dst)
    .replace(/(\..+)$/, m => ext || m[1])
}

function test(options) {
  exec(`${mocha} ${options.join(' ')}`, { silent: false })
}

// We need to make a copy when exposing targets to other scripts,
// because any method on target can be called just once per execution!
module.exports = Object.assign({}, target)
