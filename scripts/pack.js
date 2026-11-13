#!/usr/bin/env node

import { ROOT, ICONS, bail, check, download, run, say, setLogSymbol } from './util.js'
import { execFileSync } from 'node:child_process'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import {
  chmodSync,
  copyFileSync,
  cpSync,
  existsSync,
  globSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync
} from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { program } from 'commander'

import {
  author,
  channel,
  qualified,
  name,
  product,
  version
} from '../src/common/release.js'

setLogSymbol('λ')

const ARCH = {
  x64: 'x86_64',
  arm64: 'aarch64'
}

const APPIMAGETOOL_RELEASE =
  'https://github.com/AppImage/appimagetool/releases/download/1.9.1'

const APPIMAGE_RUNTIME_RELEASE =
  'https://github.com/AppImage/type2-runtime/releases/download/20251108'

const APPIMAGETOOL = {
  x86_64: {
    url: `${APPIMAGETOOL_RELEASE}/appimagetool-x86_64.AppImage`,
    sha256: 'ed4ce84f0d9caff66f50bcca6ff6f35aae54ce8135408b3fa33abfc3cb384eb0'
  },
  aarch64: {
    url: `${APPIMAGETOOL_RELEASE}/appimagetool-aarch64.AppImage`,
    sha256: 'f0837e7448a0c1e4e650a93bb3e85802546e60654ef287576f46c71c126a9158'
  }
}

const APPIMAGE_RUNTIME = {
  x86_64: {
    url: `${APPIMAGE_RUNTIME_RELEASE}/runtime-x86_64`,
    sha256: '2fca8b443c92510f1483a883f60061ad09b46b978b2631c807cd873a47ec260d'
  },
  aarch64: {
    url: `${APPIMAGE_RUNTIME_RELEASE}/runtime-aarch64`,
    sha256: '00cbdfcf917cc6c0ff6d3347d59e0ca1f7f45a6df1a428a0d6d8a78664d87444'
  }
}

async function checksum (path, algo = 'sha256') {
  let hash = createHash(algo)
  hash.update(await readFile(path))
  return hash.digest('hex')
}

async function integrity (path, algo = 'sha256') {
  let value = [algo, await checksum(path, algo)].join('|')
  await writeFile(`${path}.integrity`, value, { encoding: 'utf-8' })
  return value
}

async function downloadTool ({ url, sha256 }, path) {
  if (existsSync(path) && await checksum(path) === sha256)
    return path

  say(`downloading ${url}`)
  await download(url, path)

  let actual = await checksum(path)
  check(actual === sha256, `checksum mismatch for ${url}: ${actual}`)

  chmodSync(path, 0o755)

  return path
}

// Update information for AppImageUpdate.
// Stable releases use the releases/latest endpoint;
// Beta uses most recent pre-release instead,
// because we never clear that flag for them.
function appImageUpdateInfo (arch, tag) {
  let variant = tag ? `-${tag}-${arch}` : `[0-9]-${arch}`

  switch (channel) {
    case 'latest':
      return `gh-releases-zsync|tropy|tropy|latest|*${variant}.AppImage.zsync`
    case 'beta':
      return `gh-releases-zsync|tropy|tropy|latest-pre|*-beta.*${variant}.AppImage.zsync`
    default:
      return null
  }
}

program
  .name('tropy-pack')
  .argument('[targets...]')
  .allowUnknownOption()
  .option('--platform <name>', 'set target platform', process.platform)
  .option('--arch <name>', 'set target arch', process.arch)
  .option('--app <dir>', 'set the app directory')
  .option('--out <dir>', 'set the output directory', join(ROOT, 'dist'))
  .option('--tag <name>', 'set release tag name', process.env.PACK_TAG)
  .option('-s, --silent', 'silence packer output', false)
  .option('--sign', 'sign windows build', true)

  .action(async (args) => {
    try {
      let opts = program.opts()

      // Some packers run in other directories.
      opts.out = resolve(opts.out)
      mkdirSync(opts.out, { recursive: true })

      if (!opts.app) {
        opts.app = join(
          opts.out,
          `${qualified.product}-${opts.platform}-${opts.arch}`)
      }

      check(existsSync(opts.app), `missing app: ${opts.app}`)

      if (!args.length) {
        args = ({
          darwin: ['dmg', '7z', 'sourcemaps'],
          linux: ['bz2', 'AppImage', 'sourcemaps'],
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
    } catch (err) {
      console.error(err.stack)
      bail(err)
    }
  })


const exports = {

  sourcemaps ({ arch, out, platform }) {
    let output = join(out, `${name}-${version}-sourcemaps-${platform}-${arch}.tar.gz`)
    let rename = (platform === 'darwin')
      ? ['-s', `/^lib/${version}/`]
      : [`--transform=s/^lib/${version}/`]

    rmSync(output, { force: true })
    execFileSync('tar', ['-czf', output, ...rename, '-T', '-'], {
      cwd: ROOT,
      input: globSync('lib/**/*.map', { cwd: ROOT }).join('\n'),
      stdio: ['pipe', 'inherit', 'inherit']
    })

    return [output]
  },

  bz2 ({ app, arch, out, tag }) {
    let nva = [name, version, arch]
    let output = join(out, `${[...nva, tag].filter(x => x).join('-')}.tar.bz2`)
    let base = basename(app)

    rmSync(output, { force: true })
    execFileSync('tar', [
      '-c', '-j', '-f', output,
      '-C', dirname(app),
      `--transform=s/^${base}/${nva.join('-')}/`,
      base
    ], { stdio: 'inherit' })

    return [output]
  },

  async AppImage ({ app, arch: nodeArch, out, silent, tag }) {
    let arch = ARCH[nodeArch]
    check(arch, `unsupported arch: ${nodeArch}`)

    let name = `${[product, version, tag].filter(x => x).join('-')}-${arch}`
    let output = join(out, `${name}.AppImage`)
    let AppDir = join(out, `${product}-${version}.AppDir`)
    let updateInfo = appImageUpdateInfo(arch, tag)

    let appimagetool = await downloadTool(
      APPIMAGETOOL[arch], join(import.meta.dirname, `appimagetool-${arch}`))
    let runtime = await downloadTool(
      APPIMAGE_RUNTIME[arch], join(import.meta.dirname, `appimage-runtime-${arch}`))

    rmSync(output, { force: true })
    rmSync(`${output}.zsync`, { force: true })
    rmSync(AppDir, { force: true, recursive: true })

    try {
      let share = join(AppDir, 'usr', 'share')

      cpSync(app, AppDir, { recursive: true, verbatimSymlinks: true })
      mkdirSync(join(share, 'applications'), { recursive: true })
      mkdirSync(join(share, 'metainfo'), { recursive: true })
      renameSync(join(AppDir, 'resources', 'icons'), join(share, 'icons'))
      renameSync(join(AppDir, 'resources', 'mime'), join(share, 'mime'))

      copyFileSync(join(AppDir, `${qualified.appId}.desktop`),
        join(share, 'applications', `${qualified.appId}.desktop`))
      copyFileSync(join(AppDir, `${qualified.appId}.metainfo.xml`),
        join(share, 'metainfo', `${qualified.appId}.metainfo.xml`))

      copyFileSync(join(ROOT, 'res', 'linux', 'AppRun'), join(AppDir, 'AppRun'))
      chmodSync(join(AppDir, 'AppRun'), 0o755)

      let png = `usr/share/icons/hicolor/512x512/apps/${qualified.appId}.png`
      let svg = `usr/share/icons/hicolor/scalable/apps/${qualified.appId}.svg`

      symlinkSync(png, join(AppDir, '.DirIcon'))
      symlinkSync(svg, join(AppDir, `${qualified.appId}.svg`))

      await run(appimagetool, [
        '-n',
        '-v',
        '--runtime-file', runtime,
        ...(updateInfo ? ['-u', updateInfo] : []),
        AppDir,
        output
      ], {
        silent,
        cwd: out,
        env: {
          ...process.env,
          ARCH: arch,
          APPIMAGE_EXTRACT_AND_RUN: '1'
        }
      })

      chmodSync(output, 0o755)

    } finally {
      rmSync(AppDir, { force: true, recursive: true })
    }

    if (!updateInfo)
      return [output]

    check(existsSync(`${output}.zsync`), `missing ${output}.zsync`)
    return [output, `${output}.zsync`]
  },

  async '7z' ({ app, arch, out, platform, silent }) {
    let output = join(out, `${name}-${version}-${
      (platform === 'darwin' && arch === 'x64') ?
        platform : [platform, arch].join('-')
    }.zip`)

    let input = (platform === 'darwin') ?
      `${qualified.product}.app` :
      '.'

    rmSync(output, { force: true })
    await run('7z', ['a', output, input], { cwd: app, silent })

    return [output]
  },

  async dmg ({ app, arch, out, silent }) {
    check(process.platform === 'darwin', 'must be run on macOS')

    let output = join(
      out,
      `${name}-${version}${arch === 'x64' ? '' : `-${arch}`}.dmg`)

    let res = join(ROOT, 'res', 'dmg')
    let src = join(out, `${qualified.product}.dmg.d`)
    let bundle = `${qualified.product}.app`

    rmSync(output, { force: true })
    rmSync(src, { force: true, recursive: true })

    try {
      mkdirSync(join(src, '.background'), { recursive: true })
      await run('ditto', [join(app, bundle), join(src, bundle)])
      symlinkSync('/Applications', join(src, 'Applications'))

      await run('tiffutil', [
        '-cathidpicheck',
        join(res, 'background.png'),
        join(res, 'background@2x.png'),
        '-out', join(src, '.background', 'background.tiff')
      ], { silent: true })

      copyFileSync(join(res, `${channel}.DS_Store`), join(src, '.DS_Store'))

      await run('hdiutil', [
        'create', '-quiet',
        '-srcfolder', src,
        '-volname', qualified.product,
        '-fs', 'HFS+',
        '-format', 'UDZO',
        '-imagekey', 'zlib-level=9',
        output
      ], { silent })

    } finally {
      rmSync(src, { force: true, recursive: true })
    }

    return [output]
  },

  async squirrel ({ app, out, arch, sign }) {
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
      setupIcon: join(ROOT, 'res', 'win32', 'setup.ico'),
      loadingGif: join(ROOT, 'res', 'win32', 'install-spinner.gif'),
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
      renameSync(`${n}-${v}-full.nupkg`, nupkg)
    }

    say(`squirrel release metadata:\n${readFileSync(join(out, 'RELEASES'), 'utf-8')}`)

    return [
      join(out, setupExe),
      nupkg
    ]
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await program.parseAsync(process.argv)
}
