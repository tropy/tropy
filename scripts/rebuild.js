'use strict'

require('shelljs/make')

const entries = require('object.entries')
const log = require('./log')

const { join, resolve } = require('path')

const say = msg => log.info(msg, { tag: 'rebuild' })

const home = resolve(__dirname, '..')
const mods = join(home, 'node_modules')

const ELECTRON = v('electron-prebuilt').split('.')
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

    const flags = [
      'HAVE_USLEEP',
      'SQLITE_ENABLE_FTS5',
      'SQLITE_ENABLE_JSON1',
      'SQLITE_ENABLE_RTREE'
    ]

    rebuild(mod, {
      env: { CFLAGS: cflags(flags) },
      params: '--build-from-source'
    })

    say(`${mod} ...done`)

  } else {
    say(`${mod} ...skipped`)
  }
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

function cflags(flags) {
  return '"' + flags.map(flag => `-D${flag}=1`).join(' ') + '"'
}

function rebuild(mod, opts) {
  target.headers()

  return exec(
    `${env(opts.env)} npm rebuild ${mod} ${opts.params} ${CONFIG.join(' ')}`
  )
}

function env(vars) {
  return entries(vars).map(nv => nv.join('=')).join(' ')
}

function v(module) {
  return require(`${module}/package`).version
}
