#!/usr/bin/env node
'use strict'

const { check, error, say } = require('./util')('λ')
const { join, relative } = require('path')
const { program } = require('commander')

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
} = require('shelljs')

const {
  ROOT,
  ICONS,
  author,
  channel,
  qualified,
  name,
  product,
  version
} = require('./metadata')


program
  .name('tropy-pack')
  .arguments('[targets...]')
  .option('--platform <name>', 'set target platform', PLATFORM)
  .option('--arch <name>', 'set target arch', ARCH)
  .option('--app <dir>', 'set the app directory')
  .option('--out <dir>', 'set the output directory', join(ROOT, 'dist'))
  .option('-s, --silent', 'silence packer output', false)
  .option(
    '-c, --cert <id>',
    'set sigining certificate',
    process.env.SIGN_CERT)
  .option(
    '-p, --password <password>',
    'set signing password',
    process.env.SIGN_PASS)

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
          linux: ['bz2', 'AppImage'],
          win32: ['squirrel']
        })[opts.platform]
      }

      say(`packing for ${opts.platform} ${opts.arch}`)

      for (let type of args) {
        check(type in module.exports, `unknown package type: ${type}`)
        let output = await module.exports[type](opts)
        say(`saved "${relative(ROOT, output)}"`)
      }
    } catch (e) {
      error(e)
      console.error(e.stack)
    }
  })


module.exports = {

  bz2({ app, arch, out }) {
    let output = join(out, `${name}-${version}-${arch}.tar.bz2`)
    check(which('tar'), 'missing dependency: tar')

    rm('-f', output)
    exec(`tar cjf ${output} -C "${app}" .`)

    return output
  },

  AppImage({ app, arch, out, silent }) {
    check(arch === 'x64', 'must build for x64')

    let output = join(out, `${product}-${version}-x86_64.AppImage`)
    let AIK = 'https://github.com/AppImage/AppImageKit/releases/download/continuous'
    let AppDir = join(out, `${product}-${version}.AppDir`)
    let appimagetool = join(__dirname, 'appimagetool')

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

    return output
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

    return output
  },

  dmg({ app, arch, out, silent }) {
    check(process.platform === 'darwin', 'must be run on macOS')
    let appdmg = require('appdmg')

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
            resolve(output)
        })
       .on('error', reject)
    })
  },

  async squirrel({ app, out, arch, cert, password }) {
    let { createWindowsInstaller } = require('electron-winstaller')
    let output = `setup-${name}-${version}-${arch}.exe`

    check(process.platform === 'win32', 'must be run on Windows')
    check(cert, 'missing certificate')
    check(password, 'missing password')
    check(test('-f', cert), `certificate not found: ${cert}`)

    await createWindowsInstaller({
      appDirectory: app,
      outputDirectory: out,
      authors: author,
      signWithParams: `/fd SHA256 /f ${cert} /p "${password}"`,
      title: qualified.product,
      name: qualified.name,
      exe: `${qualified.name}.exe`,
      setupExe: output,
      setupIcon: join(ICONS, channel, `${name}.ico`),
      iconUrl: join(ICONS, channel, `${name}.ico`),
      // remoteReleases: repository.url,
      noDelta: true,
      noMsi: true
    })

    if (arch !== 'x64') {
      let v = version.replace(`${channel}.`, channel)

      mv(
        `${qualified.name}-${v}-full.nupkg`,
        `${qualified.name}-${v}-${arch}-full.nupkg`)
    }

    say(`squirrel release metadata:\n${cat(join(out, 'RELEASES'))}`)

    return output
  }
}

if (require.main === module) {
  program.parseAsync(process.argv)
}
