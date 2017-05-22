'use strict'

require('shelljs/make')

const glob = require('glob')
const { rules, say, warn } = require('./util')('make')

const { existsSync: exists } = require('fs')
const { join, resolve } = require('path')

const babel = require('./babel')
const sass = require('./sass')

const home = resolve(__dirname, '..')
const nbin = join(home, 'node_modules', '.bin')
const cov = join(home, 'coverage')
const covtmp = join(home, '.nyc_output')

const emocha = join(nbin, 'electron-mocha')
const eslint = join(nbin, 'eslint')
const sasslint = join(nbin, 'sass-lint')
const nyc = join(nbin, 'nyc')

config.fatal = false
config.silent = false

target.lint = (...args) => {
  target['lint:js'](...args)
  target['lint:css'](...args)
}

target['lint:js'] = (bail) => {
  const { code } = exec(`${eslint} --color src test static scripts`)
  if (bail && code) process.exit(code)
  return code
}

target['lint:css'] = (bail) => {
  const { code } = exec(`${sasslint} --verbose`)
  if (bail && code) process.exit(code)
  return code
}


target.test = (...args) => {
  let code

  code = target['lint']()
  code = target['test:browser'](...args) || code
  code = target['test:renderer'](...args) || code

  if (code) process.exit(1)
}

target['test:renderer'] = (args = []) => {
  return mocha(['--renderer', ...args].concat(
    glob.sync('test/**/*_test.js', { ignore: 'test/browser/*' }))).code
}

target['test:browser'] = (args = []) => {
  return mocha([...args].concat(
    glob.sync('test/{browser,common}/**/*_test.js'))).code
}

target.mocha = (args = []) => mocha([...args], false)


target.compile = () => {
  return Promise.all([
    target['compile:js'](),
    target['compile:css']()
  ])
}
target['compile:js'] = async (args = []) => {
  await babel.transform(...args)
}
target['compile:css'] = async (args = []) => {
  await sass.compile(...args)
}


target.cover = (args) => {
  rm('-rf', cov)

  rm('-rf', covtmp)
  mkdir(covtmp)

  args = args || ['text-summary', 'html', 'lcov']
  args = args.map(reporter => `-r ${reporter}`)

  process.env.COVERAGE = true

  const bc = target['test:browser'](['--require test/support/coverage'])
  const rc = target['test:renderer'](['--require test/support/coverage'])

  exec(`${nyc} report ${args.join(' ')}`, { silent: false })

  if (bc || rc) process.exit(1)
}


target.window = ([name]) => {
  template(join(home, 'static', `${name}.html`),
`<!DOCTYPE html>
<html>
<head>
  <script>require("../lib/windows/${name}.js")</script>
</head>
<body tabindex="-1" class="${name}">
  <main></main>
</body>
</html>`)

  template(join(home, 'src', 'windows', `${name}.js`), "'use strict'\n")

  const PLATFORMS = ['linux', 'darwin', 'win32']
  const THEMES = ['light', 'dark']

  for (let platform of PLATFORMS) {
    for (let theme of THEMES) {
      template(
        join(home, 'src', 'stylesheets', platform, `${name}-${theme}.scss`),
        `$platform: "${platform}";\n$theme: "${theme}\n";`
      )
    }
  }
}

function template(path, content) {
  if (!exists(path)) {
    content.to(path)
    say(path)
  } else {
    warn(path)
  }
}


target.rules = () => {
  rules(target)
}

target.clean = () => {
  rm('-rf', join(home, 'lib'))
  rm('-rf', join(home, 'dist'))
  rm('-rf', cov)
  rm('-rf', covtmp)
  rm('-f', join(home, 'npm-debug.log'))
}



function mocha(options, silent) {
  return exec(`${emocha} ${options.join(' ')}`, { silent })
}

// We need to make a copy when exposing targets to other scripts,
// because any method on target can be called just once per execution!
module.exports = Object.assign({}, target)
