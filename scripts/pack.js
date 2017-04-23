'use strict'

require('shelljs/make')

const { join, resolve } = require('path')
const release = require('../lib/common/release')
const { platform } = process

const res = resolve(__dirname, '..', 'res')
const dist = resolve(__dirname, '..', 'dist', release.channel)

target.all = () => {
  target[platform]()
}


target.linux = () => {
  assert(platform === 'linux', 'must be run on Linux')

  const targets = ls('-d', join(dist, '*-linux-*'))
  assert(targets.length, 'no targets found')

  const appimage = join(__dirname, 'appimage.sh')
  const name = (release.channel === 'stable') ?
    release.name : `${release.name}-${release.channel}`

  for (let target of targets) {
    exec(`${appimage} ${name} ${target}`)
  }
}

target.darwin = () => {
  assert(platform === 'darwin', 'must be run on macOS')
}

target.win32 = async () => {
  assert(platform === 'win32', 'must be run on Windows')

  const { createWindowsInstaller } = require('electron-winstaller')

  const targets = ls('-d', join(dist, '*-win32-*'))
  assert(targets.length, 'no targets found')

  for (let target of targets) {
    assert(target.endsWith('-x64'), 'only x64 installers supported')

    await createWindowsInstaller({
      appDirectory: target,
      outputDirectory: join(dist, 'Installer-win32-x64'),
      authors: release.author.name,
      exe: `${release.product}.exe`,
      setupIcon: join(res, 'icons', release.channel, `${release.name}.ico`)
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
