'use strict'

require('shelljs/make')

const { say } = require('./util')('rebuild')
const { join, resolve } = require('path')
const fetch = require('node-fetch')
const { writeFileSync: write } = require('fs')

const home = resolve(__dirname, '..')
const mods = join(home, 'node_modules')

const ELECTRON = v('electron').split('.')
const HEADERS = 'https://atom.io/download/electron'

const CONFIG = [
  `--arch=${process.arch}`,
  '--runtime=electron',
  `--target=${ELECTRON.join('.')}`
]

target.all = async (args) => {
  await target.sqlite3(args)
  await target.sharp(args)
  await target.idle(args)
}

target.headers = () => {
  exec(`node-gyp install --dist-url=${HEADERS} ${CONFIG.join(' ')}`)
}

target.sqlite3 = async (force) => {
  let mod = 'sqlite3'

  if (force || !test('-d', preGypBinding(mod))) {
    say(`${mod} ${force ? '(forced)' : ''}...`)

    let ext = join(home, 'ext', mod)
    let dep = join(mods, mod, 'deps')

    let url = cat(join(ext, 'version.txt')).trim()
    let tar = join(dep, url.split('/').pop())
    let version = (/-(\d+)\.tar\.gz/).exec(url)[1]

    if (!test('-f', tar)) {
      say(`${mod} fetching version ${version}...`)
      let res = await fetch(url)
      if (res.status !== 200)
        throw new Error(`download failed: ${res.status} ${res.statusText}`)

      write(tar, await res.buffer())
    }

    say(`${mod} patching...`)
    sed('-i',
      /'sqlite_version%':'\d+',/,
      `'sqlite_version%':'${version}',`,
      join(dep, 'common-sqlite.gypi'))

    cp(join(home, 'ext', mod, 'sqlite3.gyp'), dep)

    rebuild(mod, {
      params: '--build-from-source'
    })

    say(`${mod} ...done`)

  } else {
    say(`${mod} skipped`)
  }
}

target.sharp = (force) => {
  let mod = 'sharp'

  if (force || !test('-d', buildFragments(mod))) {
    rebuild(mod, {
      // params: '--build-from-source'
    })
    say(`${mod} ...done`)

  } else {
    say(`${mod} skipped`)
  }
}

target.idle = (force) => {
  let mod = 'desktop-idle'
  let version = ELECTRON.join('.')
  let marker = join(mods, mod, '.tropy_rebuild')

  if (force || !test('-f', marker) || cat(marker).trim() !== version) {
    rebuild(mod, {
      params: '--build-from-source'
    })
    version.to(marker)
    say(`${mod} ...done`)
  } else {
    say(`${mod} skipped`)
  }
}

function buildFragments(mod) {
  return join(mods, mod, 'build', 'Release', 'obj.target')
}

function preGypBinding(mod, platform = process.platform, arch = process.arch) {
  return join(mods, mod, 'lib', 'binding', [
    'electron',
    `v${ELECTRON.slice(0, 2).join('.')}`,
    platform,
    arch
  ].join('-'))
}

function rebuild(mod, opts = {}) {
  say(mod)
  target.headers()
  exec(`npm rebuild ${mod} ${opts.params} ${CONFIG.join(' ')}`)
}

function v(module) {
  return require(`${module}/package`).version
}
