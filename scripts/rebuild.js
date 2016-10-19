'use strict'

require('shelljs/make')

const log = require('./log')

const { join, resolve } = require('path')

const say = msg => log.info(msg, { tag: 'rebuild' })

const home = resolve(__dirname, '..')
const mods = join(home, 'node_modules')

const ELECTRON = v('electron').split('.')
const HEADERS = 'https://atom.io/download/atom-shell'

const CONFIG = [
  `--arch=${process.arch}`,
  '--runtime=electron',
  `--target=${ELECTRON.join('.')}`
]


target.all = (args) => {
  target.sqlite3(args)
}

target.headers = () => {
  exec(`node-gyp install --dist-url=${HEADERS} ${CONFIG.join(' ')}`)
}

target.sqlite3 = (force) => {
  const mod = 'sqlite3'

  if (force || check(mod)) {
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


function check(mod) {
  return !test('-d', join(binding(mod)))
}

function binding(mod, platform = process.platform, arch = process.arch) {
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
