'use strict'

require('shelljs/make')

const { say, error } = require('./util')('build')
const electron = require('electron/package')
const packager = require('electron-packager')
const { basename, extname, join, resolve, relative } = require('path')
const { desktop } = require('../lib/common/os')
const {
  author, channel, name, version, qualified
} = require('../lib/common/release')

const dir = resolve(__dirname, '..')
const res = join(dir, 'res')
const icons = resolve(res, 'icons', channel, 'tropy')
const mime = resolve(res, 'icons', 'mime')


target.all = (args = []) => {
  const platform = args[0] || process.platform
  const arch = args[1] || process.arch

  const icon = platform === 'win32' ?
    join(res, 'icons', channel, `${name}.ico`) :
    join(res, 'icons', channel, `${name}.icns`)

  say(`packaging for ${platform} ${arch}...`)

  packager({
    platform,
    arch,
    icon,
    dir,
    out: join(dir, 'dist'),
    name: qualified.product,
    prune: true,
    overwrite: true,
    quiet: true,
    electronVersion: electron.version,
    appVersion: version,
    appBundleId: 'org.tropy.tropy',
    helperBundleId: 'org.tropy.tropy-helper',
    appCategoryType: 'public.app-category.productivity',
    appCopyright:
      `Copyright (c) 2015-${new Date().getFullYear()} ` +
      `${author.name}. All rights not expressly granted are reserved.`,
    extendInfo: join(res, 'ext.plist'),
    extraResource: [
      join(res, 'icons', 'mime', 'tpy.icns')
    ],
    win32metadata: {
      CompanyName: author.name,
      ProductName: qualified.product
    },
    asar: {
      unpack: '**/{*.node,lib/stylesheets/**/*}',
    },
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
      /^\/res.ext/,
      /^\/res.mime/,
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
    if (err) return error(err)
    dst = String(dst)

    switch (platform) {
      case 'linux': {
        say(`renaming executable to ${qualified.name}...`)
        rename(dst, qualified.product, qualified.name)

        say('creating .desktop file...')
        desktop().to(join(dst, `${qualified.name}.desktop`))

        say('copying icons...')
        copyIcons(dst)

        say('copying mime types...')
        mkdir('-p', join(dst, 'mime', 'packages'))
        cp(join(res, 'mime', '*.xml'), join(dst, 'mime', 'packages'))

        break
      }
      case 'win32': {
        say(`renaming executable to ${qualified.name}.exe...`)
        rename(dst, `${qualified.product}.exe`, `${qualified.name}.exe`)
      }
    }

    say(`saved app to ${relative(dir, dst)}`)
  })
}

function rename(ctx, from, to) {
  mv(join(ctx, from), join(ctx, to))
}

function copyIcons(dst) {
  const theme = resolve(dst, 'icons', 'hicolor')

  for (let icon of ls(icons)) {
    let ext = extname(icon)
    let variant = basename(icon, ext)
    let target = join(theme, variant, 'apps')

    let file = (variant === 'symbolic') ?
      `${qualified.name}-symbolic${ext}` : `${qualified.name}${ext}`

    mkdir('-p', target)
    cp(join(icons, icon), join(target, file))
  }

  for (let type of ['tpy']) {
    for (let icon of ls(join(mime, type))) {
      let ext = extname(icon)
      let variant = basename(icon, ext)

      if ((/@/).test(variant)) continue

      let target = join(theme, variant, 'mimetypes')
      let file = `application-vnd.tropy.${type}{ext}`

      mkdir('-p', target)
      cp(join(mime, type, icon), join(target, file))
    }
  }
}
