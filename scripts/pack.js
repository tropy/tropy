'use strict'

require('shelljs/make')

const { join, resolve } = require('path')
const { platform } = process
const { getSignToolParams } = require('./sign')
const {
  author, channel, qualified, name, product
} = require('../lib/common/release')

const res = resolve(__dirname, '..', 'res')
const dist = resolve(__dirname, '..', 'dist', channel)

const APPIMAGETOOL = 'https://github.com/probonopd/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage'

target.all = (...args) => {
  target[platform](...args)
}


target.linux = () => {
  assert(platform === 'linux', 'must be run on Linux')

  const targets = ls('-d', join(dist, '*-linux-*'))
  assert(targets.length, 'no targets found')

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
  assert(platform === 'darwin', 'must be run on macOS')
}

target.win32 = async (args = []) => {
  assert(platform === 'win32', 'must be run on Windows')

  const { createWindowsInstaller } = require('electron-winstaller')

  const targets = ls('-d', join(dist, '*-win32-*'))
  assert(targets.length, 'no targets found')

  const [cert, pwd] = args
  assert(cert, 'missing certificate')
  assert(test('-f', cert), `certificate not found: ${cert}`)
  assert(pwd, 'missing password')

  const params = getSignToolParams(cert, pwd)

  for (let target of targets) {
    assert(target.endsWith('-x64'), 'only x64 installers supported')

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


function assert(predicate, msg, tag = 'pack') {
  if (!predicate) {
    console.error(msg, { tag })
    exit(1)
  }
}

module.exports = Object.assign({}, target)
