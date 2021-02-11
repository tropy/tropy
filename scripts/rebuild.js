'use strict'

const { say } = require('./util')('Δ')
const { join } = require('path')
const fetch = require('node-fetch')
const fs = require('fs')
const { program } = require('commander')
const { cat, cp, env, exec, sed, test } = require('shelljs')

const { ROOT } = require('./metadata')
const ARCH = process.env.npm_config_target_arch || process.arch

function v(module) {
  return require(`${module}/package.json`).version
}

function downloadHeaders({
  arch = ARCH,
  target = v('electron'),
  url = 'https://electronjs.org/headers',
  silent
}) {
  exec(`npx node-gyp install ${[
    `--dist-url=${url}`,
    `--arch=${arch}`,
    `--target=${target}`
  ].join(' ')}`, { silent })
}


class Rebuilder {
  constructor({
    name,
    arch = ARCH,
    target = v('electron'),
    silent,
    patches = [...Rebuilder.Patches[name]]
  }) {
    this.name = name
    this.platform = process.platform,
    this.arch = arch
    this.target = target
    this.silent = silent
    this.patches = patches
  }

  modulePath(...args) {
    return join(ROOT, 'node_modules', this.name, ...args)
  }

  vendorPath(...args) {
    return join(ROOT, 'vendor', this.name, ...args)
  }

  get stale() {
    switch (this.name) {
      case 'sharp':
        return !fs.existsSync(this.modulePath('build', 'Release', 'sharp.node'))
      case 'sqlite3':
        return !fs.existsSync(this.modulePath(
          'lib',
          'binding',
          `napi-v6-${this.platform}-${this.arch}`,
          'node_sqlite3.node'))
      default:
        return true
    }
  }

  async patch() {
    for (let patch of this.patches)
      await patch(this)
  }

  async rebuild() {
    return new Promise((resolve, reject) => {
      exec(`npm rebuild ${this.name} ${[
        // node-gyp
        `--arch=${this.arch}`,
        `--target=${this.target}`,

        // node-pre-gyp
        '--runtime=electron',
        `--build-from-source=${this.name}`,
        `--target_platform=${this.platform}`,
        `--target_arch=${this.arch}`

      ].join(' ')}`, { silent: this.silent }, (code, stdout, stderr) => {
        if (code !== 0)
          reject(new Error(`${this.name} rebuild exited with error code`))
        else
          resolve({ code, stdout, stderr })
      })
    })
  }


  static Patches = {
    sqlite3: [
      async (task) => {
        let url = cat(task.vendorPath('version.txt')).trim()
        let tar = task.modulePath('deps', url.split('/').pop())
        let version = (/-(\d+)\.tar\.gz/).exec(url)[1]

        if (!test('-f', tar)) {
          say(`fetching SQLite version ${version} ...`)
          let res = await fetch(url)
          if (res.status !== 200)
            throw new Error(`download failed: ${res.status} ${res.statusText}`)

          await fs.promises.writeFile(tar, await res.buffer())
        }

        sed('-i',
          /'sqlite_version%':'\d+',/,
          `'sqlite_version%':'${version}',`,
          task.modulePath('deps', 'common-sqlite.gypi'))
      },

      async (task) => {
        if (task.platform === 'darwin') {
          sed('-i',
            /"MACOSX_DEPLOYMENT_TARGET":\s*"[\d.]+",/,
            `"MACOSX_DEPLOYMENT_TARGET": "${
              task.arch === 'arm64' ? '11.0' : '10.13'
            }",`,
            task.modulePath('binding.gyp'))
        }
      },

      (task) => {
        cp(task.vendorPath('sqlite3.gyp'), task.modulePath('deps'))
      }
    ],

    sharp: [
      (task) => {
        if (task.platform === 'darwin') {
          sed('-i',
            /'MACOSX_DEPLOYMENT_TARGET':\s*'[\d.]+',/,
            `'MACOSX_DEPLOYMENT_TARGET': '${
              task.arch === 'arm64' ? '11.0' : '10.13'
            }',`,
            task.modulePath('binding.gyp'))
        }
      },
      async (task) => {
        await fs.promises.rmdir(task.modulePath('vendor'), { recursive: true })
      }
    ]
  }
}

program
  .name('tropy-rebuild')
  .arguments('[modules...]')
  .option('--arch <name>', 'set target arch', ARCH)
  .option('-f, --force', 'force rebuild', false)
  .option('-s, --silent', 'silence rebuilder output', false)
  .option('-H, --skip-headers', 'skip headers download', false)
  .option('-p, --parallel', 'rebuild in parallel', process.platform !== 'win32')
  .action(async (args) => {
    let opts = program.opts()
    if (!args.length) args = ['sqlite3', 'sharp']
    let tasks = args.map(name => new Rebuilder({ name, ...opts }))

    // Ensure we're using the latest SDK when cross-compiling!
    if (process.platform === 'darwin' && opts.arch === 'arm64')
      setMacSDKRoot()

    if (!opts.skipHeaders) {
      say('fetching Electron headers ...')
      downloadHeaders(opts)
    }

    if (opts.parallel) {
      await Promise.all(tasks.map(task =>
        rebuild(task, opts.force)))

    } else {
      for (let task of tasks)
        await rebuild(task, opts.force)
    }
  })


async function rebuild(task, force) {
  if (force || task.stale) {
    if (task.patches.length) {
      say(`${task.name} applying ${task.patches.length} patch(es) ...`)
      await task.patch()
    }

    say(`${task.name} rebuilding ...`)
    await task.rebuild()

  } else {
    say(`${task.name} rebuild skipped`)
  }
}

function setMacSDKRoot() {
  env.SDKROOT = exec('xcrun -sdk macosx --show-sdk-path', { silent: true }).trim()
}

if (require.main === module) {
  program.parseAsync(process.argv)
}
