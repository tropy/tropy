'use strict'

require('shelljs/make')

const assert = require('assert')
const path = require('path')
const fs = require('fs')
const babel = require('babel-core')
const glob = require('glob')
const moment = require('moment')
const sass = require('node-sass')
const log = require('./log')
const pkg = require('../package')

const home = path.resolve(__dirname, '..')
const nbin = path.join(home, 'node_modules', '.bin')
const cov = path.join(home, 'coverage')
const scov = path.join(home, 'src-cov')
const migrate = path.join(home, 'db', 'migrate')

const emocha = path.join(nbin, 'electron-mocha')
const lint = path.join(nbin, 'eslint')
const istanbul = path.join(nbin, 'istanbul')
const sqleton = path.join(nbin, 'sqleton')

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

  mocha(args.concat(
    glob.sync('test/**/*_test.js', { ignore: 'test/browser/*' })))
}

target['test:browser'] = (args) => {
  target.unlink()

  args = args || []
  mocha(args.concat(glob.sync('test/{browser,common}/**/*_test.js')))
}

target.mocha = (args, silent, cb) => mocha(args, silent, cb)


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
  exec(`${istanbul} instrument -o src-cov lib`, { silent: true })

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

target.migration = (args) => {
  args = (args || ['sql']).reverse()

  assert(args.length)
  assert(args[0] === 'sql' || args[0] === 'js')

  let name = mname.apply(null, args)

  mkdir('-p', migrate)
  migration.apply(null, args).to(path.join(migrate, name))

  log.info(`${name} created`, { tag: 'migration' })
}

target.schema = () => {
  const tag = 'schema'

  const Migration = require('../lib/common/migration')
  const Database = require('../lib/common/db').Database

  const tmp = path.join(home, 'db', 'db.sqlite')
  const schema = path.join(home, 'db', 'schema')

  const db = new Database(tmp)

  rm('-f', tmp)

  Migration
    .migrate(db)

    .then(ms => {
      log.info(`applied ${ms} migrations`, { tag })
    })

    .then(() => db.version())

    .then(version => {
      (`--
-- This file is auto-generated from the current state of
-- the database. Instead of editing this file, please
-- create migratios to incrementally modify the database,
-- and then regenerate this schema file.
--

-- Current migration number
PRAGMA user_version = ${version};

-- SQLite schema dump
`
      ).to(`${schema}.sql`)

      exec(`sqlite3 ${tmp} .schema >> ${schema}.sql`)
      log.info(`schema saved to ${schema}.sql`, { tag })

      exec([
        sqleton,
        `-t "${pkg.productName} #${version}"`,
        `-o ${schema}.pdf`,
        tmp
      ].join(' '))

      log.info(`schema diagram saved to ${schema}.pdf`, { tag })
    })


    .finally(() => db.close())
    .finally(() => rm(tmp))
}


target.rebuild = () => {
  const version = v('sqlite3')

  if (version !== mtag('sqlite3')) {
    log.info('sqlite3...', { tag: 'rebuild' })
    exec('CFLAGS=-DHAVE_USLEEP=1 npm rebuild sqlite3 --build-from-source')
    mtag('sqlite3', version)
  }
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

function mname(type, name) {
  return [moment().format('YYMMDDHHmm'), name, type]
    .filter(x => x)
    .join('.')
}

function migration(type, name) {
  return (type === 'sql') ?
    '' :
`'use strict'
exports.up = function ${name}$up(tx) {
  // Return a promise here!
}`
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

function mocha(options, silent, cb) {
  return exec(`${emocha} ${options.join(' ')}`, { silent }, cb)
}

function v(module) {
  return require(`../node_modules/${module}/package`).version
}

function mtag(module, version) {
  const file = path.join(home, 'node_modules', module, 'REBUILD')

  if (version) return version.to(file)
  return test('-f', file) && cat(file)
}

// We need to make a copy when exposing targets to other scripts,
// because any method on target can be called just once per execution!
module.exports = Object.assign({}, target)
