'use strict'

require('shelljs/make')

const packager = require('electron-packager')
const log = require('./log')
const release = require('../lib/common/release')

const { join, resolve } = require('path')

const dir = resolve(__dirname, '..')
const electron = require('electron/package')

target.all = () => {
  target.pack()
}

target.pack = (args = []) => {
  const tag = 'pack'

  const platform = args[0] || process.platform
  const arch = args[1] || process.arch

  const icon = platform === 'win32' ?
    join(dir, 'res', 'icons', release.channel, `${release.name}.ico`) :
    join(dir, 'res', 'icons', release.channel, `${release.name}.icns`)

  const out = join(dir, 'dist', release.channel)
  const build = exec('git describe --tags --long', { silent: true }).stdout

  packager({ /*eslint quote-props: 0 */
    platform, arch, icon, out, dir,

    name: release.product,
    asar: true,
    prune: true,
    overwrite: true,

    'version': electron.version,
    'build-version': build,
    'app-version': release.version,
    'app-copyright':
      `Copyright (c) 2015-${new Date().getFullYear()} ` +
      `${release.author.name}. All rights not expressly granted are reserved.`,

    'extend-info': join(dir, 'res', 'ext.plist'),

    ignore: [
      '.babelrc',
      '.eslintrc',
      '.gitignore',
      '.nvmrc',
      '.travis.yml',
      'coverage',
      'dist',
      'doc',
      'ext',
      'res/icons',
      'res/dmg',
      'scripts',
      'src',
      'test',
      'tmp',
      'appveyor.yml'
    ].map(i => join(dir, i))

  }, (err, dst) => {
    if (err) return log.error(err)
    log.info(`saved to ${dst}`, { tag })

    switch (platform) {
      case 'linux':
        rename(String(dst), release.product, release.name)
        log.info('renamed executable', { tag })
        break
    }
  })
}

function rename(ctx, from, to) {
  mv(join(ctx, from), join(ctx, to))
}

exports.package = target.pack
