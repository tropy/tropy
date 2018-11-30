'use strict'

require('shelljs/make')

const { say } = require('./util')('rebuild')
const { join, resolve } = require('path')

const home = resolve(__dirname, '..')
const mods = join(home, 'node_modules')

const ELECTRON = v('electron').split('.')
const HEADERS = 'https://atom.io/download/electron'

const CONFIG = [
  `--arch=${process.arch}`,
  '--runtime=electron',
  `--target=${ELECTRON.join('.')}`
]

target.all = (args) => {
  target.sqlite3(args)
  target.jsonld()
  target.sharp(args)
  target.idle()
}

target.headers = () => {
  exec(`node-gyp install --dist-url=${HEADERS} ${CONFIG.join(' ')}`)
}

target.sqlite3 = (force) => {
  let mod = 'sqlite3'

  if (force || !test('-d', preGypBinding(mod))) {
    say(`${mod} ${force ? '(forced)' : ''}...`)

    say(`${mod} patching...`)
    cp(join(home, 'ext', mod, '*'), join(mods, mod, 'deps'))

    rebuild(mod, {
      params: '--build-from-source'
    })

    say(`${mod} ...done`)

  } else {
    say(`${mod} skipped`)
  }
}

target.inspector = () => {
  rebuild('v8-debug', { params: '--build-from-source' })
  rebuild('v8-profiler', { params: '--build-from-source' })
}

target.jsonld = () => {
  rm('-rf', join(mods, 'rdf-canonize', 'build'))
  say('rdf-canonize-native removed')
  //rm('-rf', join(mods, 'rdf-canonize-native'))
  //rm('-rf', join(mods, 'jsonld', 'node-modules', 'rdf-canonize-native'))
}

target.sharp = (force) => {
  let mod = 'sharp'

  if (force || !test('-d', buildFragments(mod))) {
    rebuild(mod, {
      params: '--build-from-source'
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
