'use strict'

require('shelljs/make')

const { join, resolve, relative } = require('path')
const { product, channel } = require('../lib/common/release')
const { arch, platform } = process
const dir = resolve(__dirname, '..')


target.all = (...args) => {
  target[platform](...args)
}

target.win32 = (args = []) => {
  check(platform === 'win32', 'must be run on Windows')

  const [cert, pwd] = args

  check(pwd, 'missing password')
  check(cert, 'missing certificate')

  check(test('-f', cert), `certificate not found: ${cert}`)

  const KITS = 'C:\\Program Files (x86)\\Windows Kits\\'
  const PATH = join(KITS, '8.1', 'bin', arch)

  const signtool = join(PATH, 'signtool.exe')
  const params = getSignToolParams(cert, pwd)

  const targets = ls('-d', join(dir, 'dist', channel, '*-win32-*'))

  check(test('-f', signtool), `missing dependency: ${signtool}`)
  check(targets.length, 'no targets found')


  for (let target of targets) {
    for (let file of ls(join(target, '*.exe'))) {
      exec(`"${signtool}" sign ${params} ${file}`)
      exec(`"${signtool}" verify /pa ${file}`)
    }
  }
}

target.darwin = (args = []) => {
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

    console.log(`signing ${relative(dir, app)} with ${identity}...`)

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

  function sign(file) {
    console.log(`${relative(app, file)}`)
    exec(`codesign --sign ${identity} -fv "${file}"`, { silent: true })
  }

  function verify(file) {
    console.log(`verify ${relative(app, file)}`)
    exec(`codesign --verify --deep --display --verbose "${file}"`)
    exec(`spctl --ignore-cache --no-cache --assess -t execute --v "${file}"`)
  }
}

function check(predicate, msg) {
  if (!predicate) {
    console.error(msg)
    exit(1)
  }
}

function find(args) {
  return exec(`find ${args}`, { silent: true }).stdout.trim().split('\n')
}

function getSignToolParams(cert, pwd, ts = 'http://timestamp.comodoca.com') {
  return [
    `/t ${ts}`, '/fd SHA256', `/f ${cert}`, `/p ${pwd}`
  ].join(' ')
}

module.exports = {
  getSignToolParams
}
