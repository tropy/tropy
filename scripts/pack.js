'use strict'

require('shelljs/make')

const { join, resolve, relative } = require('path')
const release = require('../lib/common/release')
const { platform } = process

const dist = resolve(__dirname, '..', 'dist', release.channel)

target.all = () => {
  target[platform]()
}


target.darwin = (args = []) => {
  assert(platform === 'darwin', 'must be run on macOS')
}

target.win32 = async (args = []) => {
  assert(platform === 'win32', 'must be run on Windows')

  const { createWindowsInstaller } = require('electron-winstaller')
  const targets = ls('-d', join(dist, '*-win32-*'))

  assert(targets.length, 'no targets found')

  for (let target of targets) {
    assert(target.endsWith('-x64'), 'only x64 installers supported')

    await createWindowsInstaller({
      appDirectory: target,
      outputDirectory: join(dist, `${release.product}-Installer-win32-x64`),
      authors: release.author,
      exe: `${release.product}.exe`
    })
  }
}


function assert(predicate, msg, tag = 'pack') {
  if (!predicate) {
    console.error(msg, { tag })
    exit(1)
  }
}

function find(args) {
  return exec(`find ${args}`, { silent: true }).stdout.trim().split('\n')
}


module.exports = Object.assign({}, target)
