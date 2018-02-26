'use strict'

require('shelljs/make')

const { rules, say, warn } = require('./util')('make')

const { existsSync: exists } = require('fs')
const { join, resolve } = require('path')

const compile = require('./compile')
const test = require('./test')
const db = require('./db')

const home = resolve(__dirname, '..')
const nbin = join(home, 'node_modules', '.bin')

const eslint = join(nbin, 'eslint')
const sasslint = join(nbin, 'sass-lint')

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


target.test = (args = []) => {
  let code = 0

  code += target.lint()
  code += test.all(...args)

  if (code > 0) process.exit(1)
}

target['test:renderer'] = (args = []) =>
  test.renderer(...args) && process.exit(1)

target['test:browser'] = (args = []) =>
  test.browser(...args) && process.exit(1)

target.cover = (args) =>
  test.cover(args) && process.exit(1)

target.compile = () =>
  Promise.all([compile.js(), compile.css()])

target['compile:js'] = () =>
  compile.js()

target['compile:css'] = () =>
  compile.css()

target['db:create'] = db.create
target['db:migrate'] = db.migrate
target['db:migration'] = db.migration
target['db:viz'] = db.viz
target['db:all'] = db.all

target.window = ([name]) => {
  template(join(home, 'static', `${name}.html`),
`<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline';">
  <script>require("../lib/windows/${name}.js")</script>
</head>
<body id="${name}" tabindex="-1">
  <main></main>
  <div id="popup-root"></div>
</body>
</html>`)

  template(join(home, 'src', 'windows', `${name}.js`), "'use strict'\n")

  const PLATFORMS = ['linux', 'darwin', 'win32']
  const THEMES = ['light', 'dark']

  for (let platform of PLATFORMS) {
    for (let theme of THEMES) {
      template(
        join(home, 'src', 'stylesheets', platform, `${name}-${theme}.scss`),
        `$platform: "${platform}";\n$theme: "${theme}";\n`
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


target.clean = () => {
  test.clean()
  rm('-rf', join(home, 'lib'))
  rm('-f', join(home, 'npm-debug.log'))
}

target.distclean = () => {
  target.clean()
  rm('-rf', join(home, 'dist'))
}

target.rules = () =>
  rules(target)

