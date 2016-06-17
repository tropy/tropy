'use strict'

require('shelljs/make')

const packager = require('electron-packager')
const pkg = require('../package')
const log = require('./log')

const { join, resolve } = require('path')

const dir = resolve(__dirname, '..')
const electron = require('electron-prebuilt/package')

target.all = () => {
  target.pack()
}

target.pack = (args = []) => {
  const tag = 'pack'

  const channel = args[0] || 'dev'
  const platform = args[1] || process.platform
  const arch = args[2] || process.arch

  const icon = platform === 'win32' ?
    join(dir, 'res', 'icons', channel, `${pkg.name}.ico`) :
    join(dir, 'res', 'icons', channel, `${pkg.name}.icns`)

  const out = join(dir, 'dist', channel)
  const build = exec('git describe --tags --long', { silent: true }).stdout

  packager({ // eslint-disable-line quote-props
    platform, arch, icon, out, dir,

    name: pkg.productName,
    asar: true,
    prune: true,
    overwrite: true,

    'version': electron.version,
    'build-version': build,
    'app-version': pkg.version,
    'app-copyright':
      `Copyright (c) 2015-${new Date().getFullYear()} ${pkg.author.name}. ` +
      'All rights not expressly granted are reserved.',

    ignore: [
      '.babelrc',
      '.eslintrc',
      '.gitignore',
      '.nvmrc',
      '.travis.yml',
      '/coverage',
      '/dist',
      '/doc',
      '/node_modules/.bin',
      '/res/icons',
      '/res/dmg',
      '/scripts',
      '/src',
      '/test',
      '/tmp',
      'appveyor.yml'
    ]

  }, (err, dst) => {
    if (err) return log.error(err)
    log.info(`saved to ${dst}`, { tag })

    switch (platform) {
      case 'linux':
        rename(String(dst), pkg.productName, pkg.name)
        log.info('renamed executable', { tag })
        break

      case 'darwin': {
        const appdmg = require('appdmg')

        const ee = appdmg({
          target: `${out}/tropy.dmg`,
          basepath: dir,
          specification: { // eslint-disable-line quote-props
            background: `res/dmg/${channel}/background.png`,
            icon: `res/icon/${channel}/tropy.icns`,
            'icon-size': 80,
            contents: [
              {
                x: 448,
                y: 344,
                type: 'link',
                path: '/Applications'
              },
              {
                x: 192,
                y: 344,
                type: 'file',
                path: `dist/${channel}/Tropy-darwin-x64/Tropy.app`
              },
              {
                x: 512,
                y: 128,
                type: 'file',
                path: `dist/${channel}/Tropy-darwin-x64/LICENSES.chromium.html`
              }
            ]
          }
        })

        ee.on('finish', () => {
          log.info(`tropy.dmg written to ${out}`, { tag })
        })

        ee.on('error', (err) => { log.error(err) })

        break
      }
    }
  })
}

function rename(ctx, from, to) {
  mv(join(ctx, from), join(ctx, to))
}

exports.package = target.pack
