'use strict'

require('shelljs/make')

const glob = require('glob')
const { rules } = require('./util')('test')
const { join } = require('path')

const home = join(__dirname, '..')
const nbin = join(home, 'node_modules', '.bin')
const cov = join(home, 'coverage')
const out = join(home, '.nyc_output')
const emc = join(nbin, 'electron-mocha')
const nyc = join(nbin, 'nyc')

config.fatal = false
config.silent = false

target.all = (...args) =>
  all(...args) && process.exit(1)

target.run = (args = []) =>
  mocha(args)

target.renderer = (args = []) =>
  renderer(...args)

target.browser = (args = []) =>
  browser(...args)

target.clean = () =>
  clean()

target.cover = (args) =>
  cover(args) && process.exit(1)

target.rules = () =>
  rules(target)


const cover = (reporters) => {
  rm('-rf', cov)
  rm('-rf', out)
  mkdir('-p', out)

  try {
    reporters = (
      reporters || ['text-summary', 'html', 'lcov']
    ).map(reporter => `-r ${reporter}`)

    process.env.COVERAGE = true
    return all('--require test/support/coverage')

  } finally {
    exec(`${nyc} report ${reporters.join(' ')}`)
  }
}

const mocha = (options) =>
  exec(`${emc} ${options.join(' ')}`).code

const all = (...args) => (
  browser(...args) + renderer(...args)
)

const browser = (...args) => mocha([
  ...args,
  ...glob.sync('test/{browser,common}/**/*_test.js')
])

const renderer = (...args) => mocha([
  '--renderer',
  ...args,
  ...glob.sync('test/**/*_test.js', { ignore: 'test/browser/*' })
])

const clean = () => {
  rm('-rf', cov)
  rm('-rf', out)
}

module.exports = {
  mocha,
  cover,
  clean,
  all,
  browser,
  renderer
}
