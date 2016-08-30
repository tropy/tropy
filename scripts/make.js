'use strict'

require('shelljs/make')

const assert = require('assert')
const babel = require('babel-core')
const glob = require('glob')
const sass = require('node-sass')
const log = require('./log')

const { statSync: stat, existsSync: exists } = require('fs')
const { join, resolve, relative, dirname } = require('path')

const home = resolve(__dirname, '..')
const nbin = join(home, 'node_modules', '.bin')
const doc = join(home, 'doc')
const cov = join(home, 'coverage')
const scov = join(home, 'src-cov')

const emocha = join(nbin, 'electron-mocha')
const lint = join(nbin, 'eslint')
const istanbul = join(nbin, 'istanbul')

Object.assign(target, require('./electron'))

config.fatal = false
config.silent = false

target.lint = (bail) => {
  const { code } = exec(`${lint} --color src test static scripts`)
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
  target.unlink()

  return mocha(['--renderer', ...args].concat(
    glob.sync('test/**/*_test.js', { ignore: 'test/browser/*' }))).code
}

target['test:browser'] = (args = []) => {
  target.unlink()

  return mocha([...args].concat(
    glob.sync('test/{browser,common}/**/*_test.js'))).code
}

target.mocha = (args = []) => mocha([...args], false)


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
      let src = relative(home, file)
      let dst = swap(src, 'src', 'lib', '.js')

      assert(src.startsWith('src'))
      if (fresh(src, dst)) return

      log.info(dst, { tag })

      babel.transformFile(src, (err, result) => {
        if (err) return log.error(err, { tag })

        mkdir('-p', dirname(dst))
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
      let src = relative(home, file)
      let dst = swap(src, 'src', 'lib', '.css')

      assert(src.startsWith(join('src', 'stylesheets')))
      log.info(dst, { tag })

      let options = {
        file: src,
        functions: SassExtensions,
        outFile: dst,
        outputStyle: 'compressed',
        sourceMap: true
      }

      sass.render(options, (err, result) => {
        if (err) return log.error(`${err.line}: ${err.message}`, { tag })

        mkdir('-p', dirname(dst))
        String(result.css).to(dst)
        String(result.map).to(`${dst}.map`)
      })
    })
}


target.cover = (args) => {
  const tag = 'cover'
  args = args || ['html', 'lcov']

  rm('-rf', cov)
  rm('-rf', scov)

  process.env.COVERAGE = true

  let code

  code = target['test:browser'](['--require test/support/coverage'])
  mv(`${cov}/coverage-final.json`, `${cov}/coverage-browser.json`)

  code = target['test:renderer'](['--require test/support/coverage']) || code
  mv(`${cov}/coverage-final.json`, `${cov}/coverage-renderer.json`)

  log.info('writing coverage report...', { tag })
  exec(`${istanbul} report --root ${cov} ${args.join(' ')}`, { silent: true })

  rm('-rf', scov)

  if (code) process.exit(1)
}


target.window = ([name]) => {
  template(join(home, 'static', `${name}.html`),
`<!DOCTYPE html>
<html>
<head>
  <script>require("../lib/windows/${name}.js")</script>
</head>
<body tabindex="-1">
  <main></main>
</body>
</html>`)

  template(join(home, 'src', 'windows', `${name}.js`), "'use strict'\n\n{\n\}")

  const PLATFORMS = ['linux', 'darwin', 'win32']
  const THEMES = ['light', 'dark']

  for (let platform of PLATFORMS) {
    for (let theme of THEMES) {
      template(
        join(home, 'src', 'stylesheets', platform, `${name}-${theme}.scss`),
        `$platform: "${platform}";\n$theme: "${theme}";`
      )
    }
  }
}

function template(path, content) {
  if (!exists(path)) {
    content.to(path)
    log.info(path, { tag: 'created' })
  } else {
    log.warn(path, { tag: 'skipped' })
  }
}


target.rules = () => {
  for (let rule in target) log.info(rule, { tag: 'make' })
}


target.clean = () => {
  target.unlink()

  rm('-rf', join(home, 'lib'))
  rm('-rf', join(home, 'dist'))
  rm('-rf', doc)
  rm('-rf', cov)
  rm('-rf', scov)

  rm('-f', join(home, 'npm-debug.log'))
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

function mocha(options, silent) {
  return exec(`${emocha} ${options.join(' ')}`, { silent })
}

const SassExtensions = {
}

// We need to make a copy when exposing targets to other scripts,
// because any method on target can be called just once per execution!
module.exports = Object.assign({}, target)
