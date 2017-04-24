'use strict'

require('shelljs/make')

const packager = require('electron-packager')
const release = require('../lib/common/release')
const { basename, extname, join, resolve, relative } = require('path')
const dir = resolve(__dirname, '..')
const res = join(dir, 'res')
const electron = require('electron/package')

target.all = (args = []) => {
  const platform = args[0] || process.platform
  const arch = args[1] || process.arch

  const { author, channel, version, product } = release

  const icon = platform === 'win32' ?
    join(res, 'icons', channel, `${release.name}.ico`) :
    join(res, 'icons', channel, `${release.name}.icns`)

  const out = join(dir, 'dist', channel)

  packager({
    platform,
    arch,
    icon,
    out,
    dir,
    name: product,
    prune: true,
    overwrite: true,

    asar: {
      unpack: '**/*.node'
    },

    electronVersion: electron.version,
    appVersion: version,
    appBundleId: 'org.tropy.tropy',
    helperBundleId: 'org.tropy.tropy-helper',
    appCategoryType: 'public.app-category.productivity',
    appCopyright:
      `Copyright (c) 2015-${new Date().getFullYear()} ` +
      `${author.name}. All rights not expressly granted are reserved.`,

    extendInfo: join(res, 'ext.plist'),

    win32metadata: {
      CompanyName: author.name,
      ProductName: product
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
      /^\/res.linux/,
      /^\/res.ext\.plist/,
      /^\/scripts/,
      /^\/src/,
      /^\/test/,
      /^\/tmp/,
      /appveyor\.yml/
    ]

  }, (err, dst) => {
    if (err) return console.error(err)
    dst = String(dst)

    switch (platform) {
      case 'linux': {
        const name = (channel === 'stable') ?
          release.name : `${release.name}-${channel}`

        console.log(`Renaming executable to ${name}...`)
        rename(dst, product, name)

        console.log('Creating .desktop file...')
        desktop(name, release.product, name)
          .to(join(dst, `${name}.desktop`))

        console.log('Copying icons...')
        copyIcons(dst, name)

        console.log('Linking AppRun...')
        cd(dst)
        ln('-s', `./${name}`, 'AppRun')
        cd('-')

        break
      }
    }

    console.log(`Saved package in ${relative(dir, dst)}`)
  })
}

function rename(ctx, from, to) {
  mv(join(ctx, from), join(ctx, to))
}

function desktop(exec, name, icon) {
  return `#!/usr/bin/env xdg-open
[Desktop Entry]
Version=1.0
Terminal=false
Type=Application
Name=${name}
Exec=${exec} %f
Icon=${icon}
Categories=GTK;Graphics;2DGraphics;Viewer;Development;
MimeType=image/jpeg;application/x-tpy;
StartupWMClass=${name}`
}

function copyIcons(dst, name) {
  const theme = resolve(dst, 'usr', 'share', 'icons', 'hicolor')
  const icons = resolve(res, 'icons', release.channel, 'tropy')

  for (let icon of ls(icons)) {
    let ext = extname(icon)
    let variant = basename(icon, ext)
    let target = join(theme, variant, 'apps')

    let file = (variant === 'symbolic') ?
      `${name}-symbolic${ext}` : `${name}${ext}`

    mkdir('-p', target)
    cp(join(icons, icon), join(target, file))
  }

  cp(join(icons, 'scalable.svg'), join(dst, `${name}.svg`))
}
