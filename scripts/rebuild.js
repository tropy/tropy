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
    say(`${mod} ...skipped`)
  }
}

target.inspector = () => {
  rebuild('v8-debug', { params: '--build-from-source' })
  rebuild('v8-profiler', { params: '--build-from-source' })
}

target.jsonld = () => {
  say('jsonld ...remove native modules')
  rm('-rf', join(mods, 'rdf-canonize', 'build'))
  //rm('-rf', join(mods, 'rdf-canonize-native'))
  //rm('-rf', join(mods, 'jsonld', 'node-modules', 'rdf-canonize-native'))
}

target.sharp = (force) => {
  let mod = 'sharp'

  if (force || !test('-d', buildFragments(mod))) {
    rebuild('sharp', {
      params: '--build-from-source'
    })
    say(`${mod} ...done`)

  } else {
    say(`${mod} ...skipped`)
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
  target.headers()
  return exec(`npm rebuild ${mod} ${opts.params} ${CONFIG.join(' ')}`)
}

function v(module) {
  return require(`${module}/package`).version
}
