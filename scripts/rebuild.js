#!/usr/bin/env node

import { join } from 'node:path'
import fs from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { coerce } from 'semver'
import { say, setLogSymbol, ROOT } from './util.js'
import { program } from 'commander'
import { family } from 'detect-libc'
import shelljs from 'shelljs'

setLogSymbol('Δ')

const { cat, cp, env, exec, sed, test } = shelljs
const ARCH = process.env.npm_config_target_arch || process.arch

const ELECTRON_VERSION = JSON.parse(
  fs.readFileSync(join(ROOT, 'node_modules/electron/package.json'), {
    encoding: 'utf-8'
  })
).version

const LIBVIPS_VERSION = coerce(JSON.parse(
  fs.readFileSync(join(ROOT, 'node_modules/sharp/package.json'), {
    encoding: 'utf-8'
  })
).config.libvips).toString()

const LIBVIPS_URL = 'https://github.com/tropy/sharp-libvips/releases/download'
const SHARP_LIB = join(ROOT, 'node_modules', '@img')

function downloadHeaders({
  arch = ARCH,
  target = ELECTRON_VERSION,
  url = 'https://electronjs.org/headers',
  silent
}) {
  exec(`npx node-gyp install ${[
    '--ensure',
    `--dist-url=${url}`,
    `--arch=${arch}`,
    `--target=${target}`
  ].join(' ')}`, { silent })
}

async function download(url, file) {
  let res = await fetch(url)
  if (res.status !== 200)
    throw new Error(`download failed: ${res.status} ${res.statusText}`)

  await fs.promises.writeFile(file, Buffer.from(await res.arrayBuffer()))
}

class Rebuilder {
  #package = null

  constructor({
    name,
    arch = ARCH,
    target = ELECTRON_VERSION,
    libc,
    silent,
    verbose,
    steps = [...Rebuilder.Steps[name]]
  }) {
    this.name = name
    this.platform = process.platform,
    this.arch = arch
    this.target = target
    this.libc = libc
    this.silent = silent
    this.verbose = verbose
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
          'src',
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

  async exec(cmd, options = {}) {
    await new Promise((resolve, reject) => {
      exec(`npm explore ${this.name} -- ${cmd}`, {
        silent: this.silent,
        ...options
      }, (code, stdout, stderr) => {
        if (code !== 0) {
          if (!this.silent)
            console.error(stderr)
          reject(new Error(`${this.name} failed to run "${cmd}"`))
        } else {
          resolve({ code, stdout, stderr })
        }
      })
    })
  }

  static Steps = {
    sqlite3: [
      async (task) => {
        let url = cat(task.vendorPath('version.txt')).trim()
        let tar = task.modulePath('deps', url.split('/').pop())
        let version = (/-(\d+)\.tar\.gz/).exec(url)[1]

        if (!test('-f', tar)) {
          say(`fetching SQLite version ${version} ...`)
          await download(url, tar)
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
            '"MACOSX_DEPLOYMENT_TARGET": "12.0",',
            task.modulePath('binding.gyp'))
        }
      },

      (task) => {
        sed('-i', /'SQLITE_ENABLE_FTS[34]',/, '',
          task.modulePath('deps', 'sqlite3.gyp'))
      },

      async (task) => {
        // Uses node-gyp 8.x which doesn't yet pick up the env variables
        await task.exec(`npx node-gyp rebuild ${[
          `--target=${task.target}`,
          `--arch=${task.arch}`,
          task.verbose ? '--verbose' : ''
        ].join(' ')}`)
      }
    ],

    sharp: [
      async (task) => {
        if (env.SHARP_FORCE_GLOBAL_LIBVIPS === 'true') {
          say('using system libvips ...')
        } else {
          await fs.promises.mkdir(task.vendorPath(), { recursive: true })

          let platformId = `${task.platform}-${task.arch}`
          let tar = `sharp-libvips-${platformId}${task.arch === 'arm64' ? 'v8' : ''}.tar.gz`
          let url = `${LIBVIPS_URL}/v${LIBVIPS_VERSION}-tropy/${tar}`

          if (!test('-f', task.vendorPath(tar))) {
            say('fetching sharp-libvips binaries ...')
            await download(url, task.vendorPath(tar))
          }

          await fs.promises.rm(task.vendorPath('lib'), { force: true, recursive: true })
          await fs.promises.rm(task.vendorPath('include'), { force: true, recursive: true })
          say('unpacking sharp-libvips binaries ...')
          exec(`tar -C ${task.vendorPath()} -x -z -f ${task.vendorPath(tar)}`)

          say('replacing sharp-libvips lib and include ...')
          cp('-r',
            task.vendorPath('lib'),
            join(SHARP_LIB, `sharp-libvips-${platformId}`))
          cp('-r',
            task.vendorPath('include'),
            join(SHARP_LIB, 'sharp-libvips-dev'))
        }
      },

      (task) => {
        sed('-i', /sed s\\\/-/, 'sed s/-', task.modulePath('src', 'binding.gyp'))
      },

      (task) => {
        if (task.platform === 'darwin') {
          sed('-i',
            /'MACOSX_DEPLOYMENT_TARGET':\s*'[\d.]+',/,
            "'MACOSX_DEPLOYMENT_TARGET': '12.0',",
            task.modulePath('src', 'binding.gyp'))
        }
      },

      (task) => {
        if (task.platform === 'win32') {
          sed('-i',
            'libvips-42.dll',
            '*.dll',
            task.modulePath('src', 'binding.gyp'))
          sed('-i',
            /'libvips.lib'$/,
            "'libvips.lib', 'libglib-2.0.lib', 'libgobject-2.0.lib'",
            task.modulePath('src', 'binding.gyp'))
        }
      },

      async (task) => {
        await task.exec('npm run build')
      }
    ]
  }
}

program
  .name('tropy-rebuild')
  .argument('[modules...]')
  .allowUnknownOption()
  .option('--arch <name>', 'set target arch', ARCH)
  .option('-f, --force', 'force rebuild', false)
  .option('-s, --silent', 'silence rebuilder output', false)
  .option('-v, --verbose', 'passed to node-gyp', false)
  .option('-H, --skip-headers', 'skip headers download', false)
  .option('-p, --parallel', 'rebuild in parallel', false)
  .option('--global-libvips', 'use global libvips', env.SHARP_FORCE_GLOBAL_LIBVIPS === 'true')
  .action(async (args) => {
    let opts = program.opts()

    if (!args.length)
      args = ['sqlite3', 'sharp']

    opts.libc = await family() || 'unknown'

    let tasks = args.map(name => new Rebuilder({ name, ...opts }))

    // Ensure we're using the latest SDK when cross-compiling!
    if (process.platform === 'darwin' && opts.arch === 'arm64')
      setMacSDKRoot()

    if (opts.globalLibvips) {
      env.SHARP_FORCE_GLOBAL_LIBVIPS = 'true'
      delete env.SHARP_IGNORE_GLOBAL_LIBVIPS
    } else {
      delete env.SHARP_FORCE_GLOBAL_LIBVIPS
      env.SHARP_IGNORE_GLOBAL_LIBVIPS = 'true'
    }

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
    env.npm_package_config_node_gyp_target = task.target
    env.npm_package_config_node_gyp_arch = task.arch
    env.npm_config_node_gyp_target = task.target
    env.npm_config_node_gyp_arch = task.arch

    if (task.verbose) {
      env.npm_package_config_node_gyp_loglevel = 'verbose'
      env.npm_config_node_gyp_loglevel = 'verbose'
    }

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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await program.parseAsync(process.argv)
}
