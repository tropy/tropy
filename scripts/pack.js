#!/usr/bin/env node

import { ROOT, ICONS, bail, check, say, setLogSymbol } from './util.js'
import { join, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { program } from 'commander'
import shelljs from 'shelljs'

import {
  author,
  channel,
  qualified,
  name,
  product,
  version
} from '../src/common/release.js'

setLogSymbol('λ')

const ARCH =
  process.env.npm_config_target_arch ||
  process.env.npm_config_arch ||
  process.arch
const PLATFORM =
  process.env.npm_config_target_platform ||
  process.env.npm_config_platform ||
  process.platform

const {
  exec,
  cat,
  cd,
  chmod,
  cp,
  ln,
  mkdir,
  mv,
  rm,
  test,
  which
} = shelljs

async function integrity(path, algo = 'sha256') {
  let hash = createHash(algo)
  hash.update(await readFile(path))
  let checksum = [algo, hash.digest('hex')].join('|')
  await writeFile(`${path}.integrity`, checksum, { encoding: 'utf-8' })
  return checksum
}

program
  .name('tropy-pack')
  .arguments('[targets...]')
  .option('--platform <name>', 'set target platform', PLATFORM)
  .option('--arch <name>', 'set target arch', ARCH)
  .option('--app <dir>', 'set the app directory')
  .option('--out <dir>', 'set the output directory', join(ROOT, 'dist'))
  .option('-s, --silent', 'silence packer output', false)
  .option('--sign', 'sign windows build', true)

  .action(async (args) => {
    try {
      let opts = program.opts()

      if (!opts.app) {
        opts.app = join(
          opts.out,
          `${qualified.product}-${opts.platform}-${opts.arch}`)
      }

      check(test('-d', opts.app), `missing app: ${opts.app}`)

      if (!args.length) {
        args = ({
          darwin: ['dmg', '7z'],
          linux: ['bz2'],
          win32: ['squirrel']
        })[opts.platform]
      }

      say(`packing for ${opts.platform} ${opts.arch}`)

      for (let type of args) {
        check(type in exports, `unknown package type: ${type}`)
        let assets = await exports[type](opts)

        for (let asset of assets) {
          let algo = (type === 'squirrel') ? 'sha1' : 'sha256'
          let checksum = await integrity(asset, algo)
          say(`saved "${relative(ROOT, asset)}" [${checksum}]`)
        }
      }
    } catch (e) {
      console.error(e.stack)
      bail(e)
    }
  })


const exports = {

  bz2({ app, arch, out }) {
    let output = join(out, `${name}-${version}-${arch}.tar.bz2`)
    check(which('tar'), 'missing dependency: tar')

    rm('-f', output)
    exec(`tar cjf ${output} -C "${app}" .`)

    return [output]
  },

  AppImage({ app, arch, out, silent }) {
    check(arch === 'x64', 'must build for x64')

    let output = join(out, `${product}-${version}-x86_64.AppImage`)
    let AIK = 'https://github.com/AppImage/AppImageKit/releases/download/continuous'
    let AppDir = join(out, `${product}-${version}.AppDir`)
    let appimagetool = join(import.meta.dirname, 'appimagetool')

    if (!test('-f', appimagetool)) {
      check(which('curl'), 'missing dependency: curl')
      exec(`curl -L -o "${appimagetool}" ${AIK}/appimagetool-x86_64.AppImage`, {
        silent
      })
      chmod('a+x', appimagetool)
    }

    rm('-f', output)
    rm('-rf', AppDir)

    cp('-r', app, AppDir)
    mkdir('-p', `${AppDir}/usr/share`)
    mv(`${AppDir}/resources/icons`, `${AppDir}/usr/share/icons`)
    mv(`${AppDir}/resources/mime`, `${AppDir}/usr/share/mime`)

    let png = `usr/share/icons/hicolor/512x512/apps/${qualified.name}.png`
    let svg = `usr/share/icons/hicolor/scalable/apps/${qualified.name}.svg`

    cd(AppDir)
    ln('-s', qualified.name, 'AppRun')
    ln('-s', png, '.DirIcon')
    ln('-s', svg, `${qualified.name}.svg`)
    cd('-')

    exec(`"${appimagetool}" -n -v ${AppDir} ${output}`, { silent })
    chmod('a+x', output)

    rm('-rf', AppDir)

    return [output]
  },

  ['7z']({ app, arch, out, platform, silent }) {
    let output = join(out, `${name}-${version}-${
      (platform === 'darwin' && arch === 'x64') ?
        platform :
        [platform, arch].join('-')
    }.zip`)

    let input = (platform === 'darwin') ?
      `"${qualified.product}.app"` :
      '.'

    check(which('7z'), 'missing dependency: 7z')

    rm('-f', output)

    cd(app)
    // TODO verbose
    exec(`7z a ${output} ${input}`, { silent })
    cd('-')

    return [output]
  },

  async dmg({ app, arch, out, silent }) {
    check(process.platform === 'darwin', 'must be run on macOS')
    let appdmg = (await import('appdmg')).default

    let output = join(
      out,
      `${name}-${version}${arch === 'x64' ? '' : `-${arch}`}.dmg`)

    return new Promise((resolve, reject) => {
      // appdmg uses the pre-Big-Sur toolbar height when computing the
      // size based on the background image, so we set this ourselves.
      let window = {
        size: {
          width: 720,
          height: 438
        }
      }

      let contents = [
        {
          x: 216,
          y: 206,
          type: 'file',
          path: join(app, `${qualified.product}.app`)
        },
        {
          x: 504,
          y: 206,
          type: 'link',
          path: '/Applications' }
      ]

      let failures = []

      appdmg({
        target: output,
        basepath: ROOT,
        specification: {
          'title': qualified.product,
          'background': join('res', 'dmg', 'background.png'),
          'icon-size': 92,
          window,
          contents
        }
      })
        .on('progress', (info) => {
          switch (info.type) {
            case 'step-begin':
              if (!silent)
                say(`dmg: ${info.title}`)
              break
            case 'step-end':
              if (info.status === 'fail')
                failures.push(info.title)
              break
          }
        })
        .on('finish', () => {
          if (failures.length)
            reject(new Error(`dmg failures: ${failures.join(', ')}`))
          else
            resolve([output])
        })
        .on('error', reject)
    })
  },

  async squirrel({ app, out, arch, sign }) {
    let { createWindowsInstaller } = await import('electron-winstaller')
    let setupExe = `setup-${name}-${version}-${arch}.exe`
    let windowsSign

    if (sign) {
      check(process.env.SIGN_CRED, 'missing credential id')
      check(process.env.SIGN_USER, 'missing sigining user name')
      check(process.env.SIGN_PASS, 'missing signing password')
      check(process.env.SIGN_TOTP, 'missing signing TOTP secret')

      windowsSign = {
        hookModulePath: join(ROOT, 'vendor', 'sign-win32.cjs')
      }
    }

    await createWindowsInstaller({
      appDirectory: app,
      outputDirectory: out,
      authors: author,
      title: qualified.product,
      name: qualified.name,
      exe: `${qualified.name}.exe`,
      setupExe,
      setupIcon: join(ICONS, channel, `${name}.ico`),
      iconUrl: join(ICONS, channel, `${name}.ico`),
      // remoteReleases: repository.url,
      noDelta: true,
      noMsi: true,
      windowsSign
    })

    let n = join(out, qualified.name)
    let v = version.replace(`${channel}.`, channel)
    let nupkg

    if (arch === 'x64') {
      nupkg = `${n}-${v}-full.nupkg`
    } else {
      nupkg = `${n}-${v}-${arch}-full.nupkg`
      mv(`${n}-${v}-full.nupkg`, nupkg)
    }

    say(`squirrel release metadata:\n${cat(join(out, 'RELEASES'))}`)

    return [
      join(out, setupExe),
      nupkg
    ]
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await program.parseAsync(process.argv)
}
