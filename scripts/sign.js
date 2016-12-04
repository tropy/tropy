'use strict'

require('shelljs/make')

const { join, resolve, relative } = require('path')
const { product, channel } = require('../lib/common/release')
const { platform } = process

const log = require('./log')
const dir = resolve(__dirname, '..')


target.all = () => {
  target['sign:darwin']()
}


target.darwin = (args = []) => {
  const tag = 'sign:darwin'

  check(platform === 'darwin', 'must be run on macOS')

  check(which('codesign'), 'missing dependency: codesign')
  check(which('spctl'), 'missing dependency: spctl')

  const targets = ls('-d', join(dir, 'dist', channel, '*-darwin-*'))
  const identity = args[0] || env.SIGN_DARWIN_IDENTITY

  check(targets.length, 'no targets found')
  check(identity, 'missing identity')

  let app

  for (let target of targets) {
    app = join(target, `${product}.app`)
    check(app, `app not found: ${app}`)

    log.info(`signing ${relative(dir, app)} with ${identity}...`, { tag })

    for (let file of find(`"${app}" -perm +111 -type f`)) {
      sign(file)
    }

    for (let file of find(`"${join(app, 'Contents')}" -name "*.framework"`)) {
      sign(file)
    }

    for (let file of find(`"${join(app, 'Contents')}" -name "*.app"`)) {
      sign(file)
    }

    sign(app)
    verify(app)
  }


  function check(predicate, msg) {
    assert(predicate, msg, tag)
  }

  function sign(file) {
    log.info(`${relative(app, file)}`, { tag })
    exec(`codesign --sign ${identity} -fv "${file}"`, { silent: true })
  }

  function verify(file) {
    log.info(`verify ${relative(app, file)}`, { tag })
    exec(`codesign --verify --deep --display --verbose "${file}"`)
    exec(`spctl --ignore-cache --no-cache --a --t execute --v "${file}"`)
  }
}

function assert(predicate, msg, tag = 'sign') {
  if (!predicate) {
    log.error(msg, { tag })
    exit(1)
  }
}

function find(args) {
  return exec(`find ${args}`, { silent: true }).stdout.trim().split('\n')
}

module.exports = Object.assign({}, target)
