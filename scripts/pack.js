'use strict'

require('shelljs/make')

const { join, resolve } = require('path')
const { arch, platform } = process
const { getSignToolParams } = require('./sign')

const {
  author, channel, qualified, name, product, version
} = require('../lib/common/release')

const res = resolve(__dirname, '..', 'res')
const dist = resolve(__dirname, '..', 'dist', channel)

const APPIMAGETOOL = 'https://github.com/probonopd/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage'
const APPRUN = 'https://github.com/probonopd/AppImageKit/releases/download/continuous/AppRun-x86_64'

target.all = (...args) => {
  target[platform](...args)
}


target.linux = () => {
  check(platform === 'linux', 'must be run on Linux')

  const src = join(dist, `${product}-linux-${arch}`)
  check(test('-d', src), 'no target found')

  const appimagetool = join(__dirname, 'appimagetool')
  const apprun = join(__dirname, 'AppRun')

  if (!test('-f', appimagetool)) {
    exec(`curl -L -o ${appimagetool} ${APPIMAGETOOL}`)
    chmod('a+x', appimagetool)
  }

  if (!test('-f', apprun)) {
    exec(`curl -L -o ${apprun} ${APPRUN}`)
    chmod('a+x', apprun)
  }

  cp(apprun, join(src, 'AppRun'))

  const dst = join(dist, `${product}-${version}-x86_${arch.slice(1)}.AppImage`)
  exec(`${appimagetool} -n -v ${src} ${dst}`)
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
