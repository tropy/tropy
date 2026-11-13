#!/usr/bin/env node

import { dirname, join } from 'node:path'
import fs from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { coerce } from 'semver'
import { download, say, setLogSymbol, untar, ROOT } from './util.js'
import { program } from 'commander'
import { family } from 'detect-libc'
import shelljs from 'shelljs'

setLogSymbol('Δ')

const { env, exec, test } = shelljs

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

const SQLITE_URL = fs.readFileSync(
  join(ROOT, 'vendor/sqlite3/version.txt'), { encoding: 'utf-8' }
).trim()

function downloadHeaders ({
  arch = process.arch,
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

// Paths of our libvips build for the task's platform.
// sharp's build looks for `@img/sharp-libvips-dev-<platform>` first
// (include and lib), so we unpack it as that package and put it
// on the NODE_PATH instead of overwriting the npm-installed ones.
// At runtime, our sharp build looks for libvips
// in `../../sharp-libvips-<platform>/lib` (rpath).
function libvips (task) {
  let platformId = `${task.platform}-${task.arch}`
  let release = `v${LIBVIPS_VERSION}-tropy`
  let tar = `sharp-libvips-${platformId}${task.arch === 'arm64' ? 'v8' : ''}.tar.gz`

  return {
    platformId,
    url: `${LIBVIPS_URL}/${release}/${tar}`,
    tar: task.vendorPath(release, tar),
    nodePath: task.vendorPath(release, 'node_modules'),
    dev: task.vendorPath(release, 'node_modules', '@img', `sharp-libvips-dev-${platformId}`),
    runtime: task.modulePath('src', `sharp-libvips-${platformId}`)
  }
}

class Rebuilder {
  #package = null

  constructor ({
    name,
    arch,
    target = ELECTRON_VERSION,
    libc,
    silent,
    verbose,
    steps = [...Rebuilder.Steps[name]]
  }) {
    this.name = name
    this.platform = process.platform
    this.arch = arch
    this.target = target
    this.libc = libc
    this.silent = silent
    this.verbose = verbose
    this.steps = steps
  }

  modulePath (...args) {
    return join(ROOT, 'node_modules', this.name, ...args)
  }

  vendorPath (...args) {
    return join(ROOT, 'vendor', this.name, ...args)
  }

  nodeGypPath (...args) {
    return join(ROOT, 'node_modules', 'node-gyp', ...args)
  }

  get package () {
    if (!this.#package)
      this.#package = JSON.parse(
        fs.readFileSync(this.modulePath('package.json'))
      )

    return this.#package
  }

  // Everything the build depends on, written after a successful rebuild.
  get stamp () {
    return JSON.stringify({
      version: this.package.version,
      target: this.target,
      arch: this.arch,
      deps: (this.name === 'sharp') ?
        (env.SHARP_FORCE_GLOBAL_LIBVIPS === 'true' ? 'global' : LIBVIPS_VERSION) :
        SQLITE_URL
    })
  }

  get stampPath () {
    return (this.name === 'sharp') ?
      this.modulePath('src', 'build', 'tropy-rebuild.json') :
      this.modulePath('build', 'tropy-rebuild.json')
  }

  get stale () {
    try {
      return fs.readFileSync(this.stampPath, { encoding: 'utf-8' }) !== this.stamp
    } catch {
      return true
    }
  }

  async exec (cmd, options = {}) {
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

  async nodeGypRebuild (args, options) {
    await this.exec(`node ${
      this.nodeGypPath('bin', 'node-gyp.js')
    } rebuild ${args.join(' ')}`, options)
  }

  static Steps = {
    sharp: [
      async (task) => {
        if (env.SHARP_FORCE_GLOBAL_LIBVIPS === 'true') {
          say('using system libvips ...')
          return
        }

        let { tar, url, dev, nodePath } = libvips(task)

        if (!fs.existsSync(tar)) {
          say('fetching sharp-libvips binaries ...')
          await fs.promises.mkdir(dirname(tar), { recursive: true })
          await download(url, tar)
        }

        say('unpacking sharp-libvips binaries ...')
        await fs.promises.rm(dev, { force: true, recursive: true })
        await fs.promises.mkdir(dev, { recursive: true })
        untar(tar, dev)

        for (let dir of ['include', 'lib'])
          await fs.promises.writeFile(
            join(dev, dir, 'index.js'),
            'module.exports = __dirname\n')

        env.NODE_PATH = nodePath
      },

      async (task) => {
        await task.exec('npm run build')
      },

      async (task) => {
        let { platformId, dev, runtime } = libvips(task)

        if (env.SHARP_FORCE_GLOBAL_LIBVIPS !== 'true') {
          // Put libvips where our build looks for it at runtime,
          // so it also loads outside the bundle (tests, scripts).
          await fs.promises.rm(runtime, { force: true, recursive: true })
          await fs.promises.cp(join(dev, 'lib'), join(runtime, 'lib'), {
            recursive: true
          })
          await fs.promises.cp(
            join(dev, 'THIRD-PARTY-NOTICES.json'),
            join(runtime, 'THIRD-PARTY-NOTICES.json'))
        }

        // Outside the bundle, sharp falls back to npm's prebuilt
        // binary if ours fails to load: remove it, so that it fails.
        await fs.promises.rm(join(ROOT, 'node_modules', '@img', `sharp-${platformId}`), {
          force: true,
          recursive: true
        })
      }
    ],

    'better-sqlite3': [
      async (task) => {
        let version = (/-(\d+)\.tar\.gz/).exec(SQLITE_URL)[1]
        let tar = task.vendorPath('../sqlite3', SQLITE_URL.split('/').pop())

        if (!test('-f', tar)) {
          say(`fetching SQLite version ${version} ...`)
          await download(SQLITE_URL, tar)
        }

        let prefix = `sqlite-autoconf-${version}`
        let dest = task.modulePath('deps', 'sqlite3')
        untar(tar, dest, '--strip-components=1', `${prefix}/sqlite3.c`, `${prefix}/sqlite3.h`)
      },

      async (task) => {
        // Subtle: better-sqlite3 skips the build when it ships
        // a prebuild for the host (with its own SQLite version)!
        await task.nodeGypRebuild([
          `--target=${task.target}`,
          `--arch=${task.arch}`,
          '--force_build=1',
          task.verbose ? '--verbose' : ''
        ])
      },

      async (task) => {
        // Outside the bundle (tests, scripts) better-sqlite3 would
        // still load a prebuild over our build: remove them.
        await fs.promises.rm(task.modulePath('prebuilds'), {
          force: true,
          recursive: true
        })
      }
    ]
  }
}

program
  .name('tropy-rebuild')
  .argument('[modules...]')
  .allowUnknownOption()
  .option('--arch <name>', 'set target arch', process.arch)
  .option('-f, --force', 'force rebuild', false)
  .option('-s, --silent', 'silence rebuilder output', false)
  .option('-v, --verbose', 'passed to node-gyp', false)
  .option('-H, --skip-headers', 'skip headers download', false)
  .option('-p, --parallel', 'rebuild in parallel', false)
  .option('--global-libvips', 'use global libvips', env.SHARP_FORCE_GLOBAL_LIBVIPS === 'true')
  .action(async (args) => {
    let opts = program.opts()

    if (!args.length)
      args = ['better-sqlite3', 'sharp']

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


async function rebuild (task, force) {
  if (force || task.stale) {
    // node-gyp options for sharp's build, which passes no arguments.
    env.npm_package_config_node_gyp_target = task.target
    env.npm_package_config_node_gyp_arch = task.arch

    // sharp reads it to pick libvips when cross-compiling;
    // npm warns about it, so only set it when needed.
    if (task.arch !== process.arch)
      env.npm_config_arch = task.arch

    if (task.verbose)
      env.npm_package_config_node_gyp_loglevel = 'verbose'

    for (let i = 0; i < task.steps.length; ++i) {
      say(`${task.name} rebuilding #${i + 1}...`)
      await task.steps[i](task)
    }

    await fs.promises.writeFile(task.stampPath, task.stamp)
  } else {
    say(`${task.name} rebuild skipped`)
  }
}

function setMacSDKRoot () {
  env.SDKROOT =
    exec('xcrun -sdk macosx --show-sdk-path', { silent: true }).trim()
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await program.parseAsync(process.argv)
}
