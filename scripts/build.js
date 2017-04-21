'use strict'

require('shelljs/make')

const packager = require('electron-packager')
const release = require('../lib/common/release')
const { join, resolve } = require('path')
const dir = resolve(__dirname, '..')
const res = join(dir, 'res')
const electron = require('electron/package')

target.all = (args = []) => {
  const tag = 'build'

  const platform = args[0] || process.platform
  const arch = args[1] || process.arch

  const icon = platform === 'win32' ?
    join(res, 'icons', release.channel, `${release.name}.ico`) :
    join(res, 'icons', release.channel, `${release.name}.icns`)

  const out = join(dir, 'dist', release.channel)

  packager({
    platform, arch, icon, out, dir,

    name: release.product,
    prune: true,
    overwrite: true,

    asar: {
      unpack: '**/*.node'
    },

    electronVersion: electron.version,
    appVersion: release.version,
    appBundleId: 'org.tropy.tropy',
    helperBundleId: 'org.tropy.tropy-helper',
    appCategoryType: 'public.app-category.productivity',
    appCopyright:
      `Copyright (c) 2015-${new Date().getFullYear()} ` +
      `${release.author.name}. All rights not expressly granted are reserved.`,

    extendInfo: join(res, 'ext.plist'),

    win32metadata: {
      CompanyName: release.author.name,
      ProductName: release.product
    },

    extraResource: [
      join(res, 'icons', 'mime', 'tpy.icns')
    ],

    ignore: [
      /.DS_Store/,
      /.babelrc/,
      /.eslintrc/,
      /.gitignore/,
      /.nvmrc/,
      /.nyc_output/,
      /.sass-lint\.yml/,
      /.travis\.yml/,
      /.vimrc/,
      /^\/coverage/,
      /^\/db.test/,
      /^\/dist/,
      /^\/doc/,
      /^\/ext/,
      /^\/res.icons/,
      /^\/res.dmg/,
      /^\/res.ext\.plist/,
      /^\/scripts/,
      /^\/src/,
      /^\/test/,
      /^\/tmp/,
      /appveyor\.yml/
    ]

  }, (err, dst) => {
    if (err) return console.error(err)
    console.log(`Saved to ${dst}`)

    switch (platform) {
      case 'linux':
        rename(String(dst), release.product, release.name)
        console.log('Renamed executable')
        break
    }
  })
}

function rename(ctx, from, to) {
  mv(join(ctx, from), join(ctx, to))
}
