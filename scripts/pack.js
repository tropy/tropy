'use strict'

require('shelljs/make')

const { join, resolve } = require('path')
const { platform } = process
const { getSignToolParams } = require('./sign')

const {
  author, channel, qualified, name, product, version
} = require('../lib/common/release')

const res = resolve(__dirname, '..', 'res')
const dist = resolve(__dirname, '..', 'dist', channel)

const APPIMAGETOOL = 'https://github.com/probonopd/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage'

target.all = (...args) => {
  target[platform](...args)
}


target.linux = () => {
  check(platform === 'linux', 'must be run on Linux')

  const targets = ls('-d', join(dist, '*-linux-*'))
  check(targets.length, 'no targets found')

  const appimagetool = join(__dirname, 'appimagetool')

  if (!test('-f', appimagetool)) {
    exec(`curl -L -o ${appimagetool} ${APPIMAGETOOL}`)
    chmod('a+x', appimagetool)
  }

  for (let target of targets) {
    cd(dist)
    exec(`${appimagetool} -n ${target}`)
    cd('-')
  }
}

target.darwin = () => {
  check(platform === 'darwin', 'must be run on macOS')
  check(which('appdmg'), 'missing dependency: appdmg')

  const targets = ls('-d', join(dist, '*-darwin-*'))
  check(targets.length, 'no targets found')

  for (let target of targets) {
    let app = join(target, `${product}.app`)
    let dmg = join(dist, `${name}-${version}.dmg`)

    let config = join(res, 'dmg', channel, 'appdmg.json')

    check(test('-d', app), `missing app: ${app}`)
    check(test('-f', config), `missing config: ${config}`)

    exec(`appdmg ${config} ${dmg}`)
  }
}

target.win32 = async (args = []) => {
  check(platform === 'win32', 'must be run on Windows')

  const { createWindowsInstaller } = require('electron-winstaller')

  const targets = ls('-d', join(dist, '*-win32-*'))
  check(targets.length, 'no targets found')

  const [cert, pwd] = args
  check(cert, 'missing certificate')
  check(test('-f', cert), `certificate not found: ${cert}`)
  check(pwd, 'missing password')

  const params = getSignToolParams(cert, pwd)

  for (let target of targets) {
    await createWindowsInstaller({
      appDirectory: target,
      outputDirectory: dist,
      authors: author.name,
      signWithParams: params,
      exe: `${product}.exe`,
      setupExe: `setup-${qualified.name}.exe`,
      setupIcon: join(res, 'icons', channel, `${name}.ico`),
      noMsi: true
    })
  }
}


function check(predicate, msg) {
  if (!predicate) {
    console.error(msg)
    exit(1)
  }
}

module.exports = Object.assign({}, target)
