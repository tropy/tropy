'use strict'

require('shelljs/make')

const { check, say } = require('./util')('ξ')
const { join, resolve, relative } = require('path')
const { arch, platform } = process
const dir = resolve(__dirname, '..')

const BABEL_CONFIG = {
  presets: [
    '@babel/preset-react'
  ],
  plugins: [
    '@babel/plugin-syntax-class-properties',
    '@babel/plugin-proposal-export-namespace-from',
    'babel-plugin-dynamic-import-node',
    '@babel/plugin-transform-modules-commonjs'
  ]
}

require('@babel/register')(BABEL_CONFIG)
const { qualified } = require('../src/common/release')

const KITS = 'C:\\Program Files (x86)\\Windows Kits\\'

target.all = (...args) => {
  target[platform](...args)
}

target.linux = () => {
  say('skipping linux code-signing...')
}

target.win32 = (args = []) => {
  if (args[0] === 'force') {
    check(platform === 'win32', 'must be run on Windows')

    let [, cert, pass] = args
    cert = cert || env.SIGN_WIN32_CERT
    pass = pass || env.SIGN_WIN32_PASS

    check(pass, 'missing password')
    check(cert, 'missing certificate')
    check(test('-f', cert), `certificate not found: ${cert}`)

    const signtool = getSignTool()
    const params = getSignToolParams(cert, pass)
    check(signtool, `missing dependency: ${signtool}`)

    const targets = ls('-d', join(dir, 'dist', '*-win32-*'))
    check(targets.length, 'no targets found')

    for (let target of targets) {
      for (let file of ls(join(target, '*.exe'))) {
        exec(`"${signtool}" sign ${params} "${file}"`)
        exec(`"${signtool}" verify /pa "${file}"`)
      }
    }
  } else {
    say('win32 code-signing not forced, skipping...')
  }
}

target.darwin = async (args = []) => {
  check(platform === 'darwin', 'must be run on macOS')
  const { notarize } = require('electron-notarize')

  let codesign = which('codesign')
  let spctl = which('spctl')
  let xcrun = which('xcrun')

  check(codesign, 'missing dependency: codesign')
  check(spctl, 'missing dependency: spctl')
  check(xcrun, 'missing dependency: xcrun')

  let targets = ls('-d', join(dir, 'dist', '*-darwin-*'))
  let identity = args[0] || env.SIGN_CERT
  let appleId = args[1] || env.SIGN_USER
  let entitlements = join(dir, 'res', 'darwin', 'entitlements.plist')

  let options = [
    `--sign ${identity}`,
    '--options runtime',
    '--force',
    '--verbose',
    '--timestamp',
    `--entitlements ${entitlements}`
  ].join(' ')

  check(targets.length, 'no targets found')

  if (identity == null) {
    say('missing identity, skipping darwin code-signing...')
    return
  }

  let app
  let cnt

  for (let target of targets) {
    app = join(target, `${qualified.product}.app`)
    cnt = join(app, 'Contents')
    check(test('-d', app), `app not found: ${app}`)

    // clear temporary files from previous signing
    for (let file of find(`"${app}" -name "*.cstemp" -type f`)) {
      if (file) rm(file)
    }

    say(`signing ${relative(dir, app)}...`)

    for (let file of find(`"${join(cnt, 'Resources')}" -perm +111 -type f`)) {
      sign(file)
    }
    for (let file of find(`"${join(cnt, 'Resources')}" -name "*.dylib"`)) {
      sign(file)
    }
    // Sign crashpad handler first!
    for (let file of find(
      `"${join(cnt, 'Frameworks')}" -perm +111 -type f -name "*_handler"`)
    ) {
      sign(file)
    }
    for (let file of find(`"${join(cnt, 'Frameworks')}" -perm +111 -type f`)) {
      sign(file)
    }
    for (let file of find(`"${cnt}" -name "*.app" -type d`)) {
      sign(file)
    }
    for (let file of find(`"${cnt}" -name "*.framework" -type d`)) {
      sign(file)
    }
    for (let file of find(`"${join(cnt, 'MacOS')}" -perm +111 -type f`)) {
      sign(file)
    }

    sign(app)

    if (appleId != null) {
      say(`notarize ${relative(dir, app)}...`)
      await notarize({
        appBundleId: 'org.tropy.tropy',
        appPath: app,
        appleId,
        appleIdPassword: '@keychain:TROPY_DEV_PASSWORD',
        ascProvider: 'CorporationforDigitalScholarship'
      })
    } else {
      say('apple id missing, skipping notarization...')
    }

    say(`verify ${relative(dir, app)}...`)
    verify(app)
  }

  function sign(file) {
    say(`${app !== file ? relative(app, file) : '.'}`)
    exec(`${codesign} ${options} "${file}"`, { silent: true })
  }

  function verify(file) {
    exec(`${codesign} --verify --deep --display --verbose=2 "${file}"`)
    exec(`${spctl} --ignore-cache --no-cache --assess -t execute --v "${file}"`)
  }
}

function find(args) {
  return exec(`find ${args}`, { silent: true }).stdout.trim().split('\n')
}


function getSignTool() {
  return [
    join(KITS, '8.1', 'bin', arch, 'signtool.exe'),
    join(KITS, '10', 'bin', arch, 'signtool.exe')
  ].find(signtool => test('-f', signtool))
}

function getSignToolParams(cert, pass) {
  return [
    '/fd SHA256', `/f ${cert}`, `/p "${pass}"`
  ].join(' ')
}

module.exports = {
  getSignTool,
  getSignToolParams
}
