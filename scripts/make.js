'use strict'

require('shelljs/make')

const { rules, say, warn } = require('./util')('make')

const { existsSync: exists } = require('fs')
const { join, resolve } = require('path')

const babel = require('./babel')
const sass = require('./sass')

const home = resolve(__dirname, '..')
const nbin = join(home, 'node_modules', '.bin')

const test = require('./test')
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


target.compile = () => {
  return Promise.all([
    babel.transform(),
    sass.compile()
  ])
}

target['compile:js'] = async (args = []) =>
  babel.transform(...args)

target['compile:css'] = async (args = []) =>
  sass.compile(...args)

target.cover = (args) =>
  test.cover(args) && process.exit(1)


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
  test.clean()
  rm('-rf', join(home, 'lib'))
  rm('-rf', join(home, 'dist'))
  rm('-f', join(home, 'npm-debug.log'))
}
