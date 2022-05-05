'use strict'

const { say } = require('./util')('Δ')
const { join } = require('path')
const fs = require('fs')
const { program } = require('commander')
const { cat, cd, cp, env, exec, sed, test } = require('shelljs')
const { family } = require('detect-libc')

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
  #package = null

  constructor({
    name,
    arch = ARCH,
    target = v('electron'),
    libc,
    silent,
    steps = [...Rebuilder.Steps[name]]
  }) {
    this.name = name
    this.platform = process.platform,
    this.arch = arch
    this.target = target
    this.libc = libc
    this.silent = silent
    this.steps = steps
  }

  modulePath(...args) {
    return join(ROOT, 'node_modules', this.name, ...args)
  }

  vendorPath(...args) {
    return join(ROOT, 'vendor', this.name, ...args)
  }

  get package() {
    if (!this.#package)
      this.#package = JSON.parse(
        fs.readFileSync(this.modulePath('package.json'))
      )

    return this.#package
  }

  get stale() {
    switch (this.name) {
      case 'sharp':
        return !fs.existsSync(this.modulePath(
          'build',
          'Release',
          `sharp-${this.platform}-${this.arch}.node`))
      case 'sqlite3':
        return !fs.existsSync(this.modulePath(
          'lib',
          'binding',
          `napi-v6-${this.platform}-${this.libc}-${this.arch}`,
          'node_sqlite3.node'))
      default:
        return true
    }
  }

  async exec(cmd) {
    try {
      var cwd = process.cwd()
      cd(this.modulePath())

      await new Promise((resolve, reject) => {
        exec(cmd, { silent: this.silent }, (code, stdout, stderr) => {
          if (code !== 0) {
            if (this.silent)
              console.error(stderr)

            reject(new Error(`${this.name} failed to run: ${cmd}`))

          } else {
            resolve({ code, stdout, stderr })
          }
        })
      })
    } finally {
      cd(cwd)
    }
  }

  async nodeGypRebuild() {
    await this.exec(`npx node-gyp rebuild ${[
      ...this.buildArgs(),
      ...this.buildArgsFromBinaryField()
    ].join(' ')}`)
  }

  buildArgs() {
    return [
      `--arch=${this.arch}`,
      `--target=${this.target}`,
      '--runtime=electron',
      '--build-from-source',
      this.silent ? '--silent' : '--verbose',
      `--target_platform=${this.platform}`,
      `--target_arch=${this.arch}`
    ]
  }

  buildArgsFromBinaryField() {
    let { binary = {} } = this.package

    return Object.entries((binary)).map(([key, value]) => {
      if (key === 'napi_versions')
        return

      if (key === 'module_path')
        value = this.modulePath(value)

      value = value
        .replace('{version}', this.package.version)
        .replace('{napi_build_version}', () => binary.napi_versions.at(-1))
        .replace('{platform}', this.platform)
        .replace('{arch}', this.arch)
        .replace('{libc}', this.libc)

      return `--${key}=${value}`
    })
  }

  static Steps = {
    fsevents: [
      (task) => {
        cp(task.vendorPath('binding.gyp'), task.modulePath('binding.gyp'))
      },
      async (task) => {
        await task.nodeGypRebuild()
      }
    ],

    sqlite3: [
      async (task) => {
        let url = cat(task.vendorPath('version.txt')).trim()
        let tar = task.modulePath('deps', url.split('/').pop())
        let version = (/-(\d+)\.tar\.gz/).exec(url)[1]

        if (!test('-f', tar)) {
          say(`fetching SQLite version ${version} ...`)
          let { default: fetch } = await import('node-fetch')
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
        sed('-i', /'SQLITE_ENABLE_FTS[34]',/, '',
          task.modulePath('deps', 'sqlite3.gyp'))
      },

      async (task) => {
        await task.nodeGypRebuild()
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
        await fs.promises.rm(task.modulePath('vendor'), {
          force: true,
          recursive: true
        })
      },
      async (task) => {
        try {
          await task.exec('node install/libvips.js')
        } catch (e) {
          // Can fail if using global libvips
        }
      },
      async (task) => {
        await task.nodeGypRebuild()
      },
      async (task) => {
        await task.exec('node install/dll-copy.js')
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
  .option('--global-libvips', 'do not ignore global libvips', false)
  .action(async (args) => {
    let opts = program.opts()

    if (!args.length)
      args = ['sqlite3', 'sharp', 'fsevents']
    if (process.platform !== 'darwin')
      args = args.filter(m => m !== 'fsevents')

    opts.libc = await family() || 'unknown'

    let tasks = args.map(name => new Rebuilder({ name, ...opts }))

    // Ensure we're using the latest SDK when cross-compiling!
    if (process.platform === 'darwin' && opts.arch === 'arm64')
      setMacSDKRoot()

    if (!opts.globalLibvips)
      env.SHARP_IGNORE_GLOBAL_LIBVIPS = true

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
    for (let i = 0; i < task.steps.length; ++i) {
      say(`${task.name} rebuilding #${i + 1}...`)
      await task.steps[i](task)
    }
  } else {
    say(`${task.name} rebuild skipped`)
  }
}

function setMacSDKRoot() {
  env.SDKROOT =
    exec('xcrun -sdk macosx --show-sdk-path', { silent: true }).trim()
}

if (require.main === module) {
  program.parseAsync(process.argv)
}
