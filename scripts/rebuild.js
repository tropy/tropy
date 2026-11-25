#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import fs from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { coerce } from 'semver'
import { check, download, run, say, setLogSymbol, untar, ROOT } from './util.js'
import { program } from 'commander'
import { family } from 'detect-libc'

setLogSymbol('Δ')

const { env } = process

const NODE_GYP = join(ROOT, 'node_modules', 'node-gyp', 'bin', 'node-gyp.js')

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

async function downloadHeaders ({
  arch = process.arch,
  target = ELECTRON_VERSION,
  url = 'https://electronjs.org/headers',
  silent
}) {
  await run(process.execPath, [
    NODE_GYP,
    'install',
    '--ensure',
    `--dist-url=${url}`,
    `--arch=${arch}`,
    `--target=${target}`
  ], { silent })
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
  let runtime = task.modulePath('src', `sharp-libvips-${platformId}`)

  return {
    platformId,
    url: `${LIBVIPS_URL}/${release}/${tar}`,
    tar: task.vendorPath(release, tar),
    nodePath: task.vendorPath(release, 'node_modules'),
    dev: task.vendorPath(release, 'node_modules', '@img', `sharp-libvips-dev-${platformId}`),
    runtime,
    so: join(runtime, 'lib', `libvips-cpp.so.${LIBVIPS_VERSION}`)
  }
}

const GLIB_SYMBOL = /^_*g(lib)?_/

const dynamicSymbols = (file, ...args) =>
  execFileSync('nm', [
    '-D', '-j', '--without-symbol-versions', ...args, file
  ], { encoding: 'utf-8' }).split('\n').filter(Boolean)

// Our libvips links glib statically and exports its symbols for sharp.
// Electron links the system glib, which comes first in the global
// symbol scope: sharp (and libvips itself, for glib's data symbols)
// would bind to the system glib and mix two GObject implementations.
// Renaming the exported glib symbols in both keeps them apart.
async function renameGlibSymbols (task) {
  let { platformId, so } = libvips(task)
  let sharp = task.modulePath(
    'src',
    'build',
    'Release',
    `sharp-${platformId}-${task.package.version}.node`)

  let map = dynamicSymbols(so, '--defined-only')
    .filter(name => GLIB_SYMBOL.test(name))
    .map(name => `${name} vips__${name}\n`)
    .join('')

  let mapFile = task.modulePath('src', 'build', 'glib-rename.map')
  await fs.promises.writeFile(mapFile, map)

  say('renaming glib symbols ...')
  for (let file of [so, sharp])
    await run('patchelf', ['--rename-dynamic-symbols', mapFile, file], {
      silent: task.silent
    })

  // Any glib symbol sharp still imports would bind to the system glib.
  let missed = dynamicSymbols(sharp, '--undefined-only')
    .filter(name => GLIB_SYMBOL.test(name))

  check(!missed.length, `sharp imports unrenamed glib symbols: ${missed}`)
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
      deps: (this.name === 'sharp')
        ? (env.SHARP_FORCE_GLOBAL_LIBVIPS === 'true' ? 'global' : LIBVIPS_VERSION)
        : SQLITE_URL
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

  async nodeGypRebuild (args) {
    await run(process.execPath, [NODE_GYP, 'rebuild', ...args], {
      cwd: this.modulePath(),
      silent: this.silent
    })
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
        // The shell resolves the npm command shim on Windows.
        await run('npm run build', [], {
          cwd: task.modulePath(),
          shell: true,
          silent: task.silent
        })
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

          if (task.platform === 'linux')
            await renameGlibSymbols(task)
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

        if (!fs.existsSync(tar)) {
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
          ...(task.verbose ? ['--verbose'] : [])
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
      await downloadHeaders(opts)
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
  env.SDKROOT = execFileSync('xcrun', ['-sdk', 'macosx', '--show-sdk-path'], {
    encoding: 'utf-8'
  }).trim()
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await program.parseAsync(process.argv)
}
