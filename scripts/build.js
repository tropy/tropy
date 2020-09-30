'use strict'

require('shelljs/make')

const { say, error } = require('./util')('build')
const electron = require('electron/package')
const packager = require('electron-packager')
const { basename, extname, join, resolve, relative } = require('path')
const RRCHNM = 'Roy Rosenzweig Center for History and New Media, George Mason University'

const BABEL_CONFIG = {
  presets: [
    '@babel/preset-react'
  ],
  plugins: [
    '@babel/plugin-syntax-class-properties',
    '@babel/plugin-proposal-export-namespace-from',
    'babel-plugin-dynamic-import-node',
    '@babel/plugin-transform-modules-commonjs'
  ]
}

require('@babel/register')(BABEL_CONFIG)
const { channel, name, version, qualified } = require('../src/common/release')
const { SUPPORTED } = require('../src/constants/image').default

const dir = resolve(__dirname, '..')
const res = join(dir, 'res')
const icons = resolve(res, 'icons', channel, 'tropy')
const mime = resolve(res, 'icons', 'mime')

const SHARP = join('lib', 'vendor', 'lib')

const IGNORE = [
  /\.(js|css)\.map$/,
  /(CHANGELOG|README)/,
  /\.DS_Store/,
  /\.babelrc\.js/,
  /\.editorconfig/,
  /\.eslintrc/,
  /\.gitignore/,
  /\.nvmrc/,
  /\.nyc_output/,
  /\.rollup\.config\.js/,
  /\.sass-lint\.yml/,
  /\.travis\.yml/,
  /\.vimrc/,
  /^\/coverage/,
  /^\/db.test/,
  /^\/dist/,
  /^\/doc/,
  /^\/vendor/,
  /^\/res.ext/,
  /^\/res.mime/,
  /^\/res.dmg/,
  /^\/res.linux/,
  /^\/res.ext\.plist/,
  /^\/scripts/,
  /^\/src/,
  /^\/test/,
  /^\/tmp/,
  /appveyor\.yml/,
  /node_modules/
]

target.all = async (args = []) => {
  try {

    let platform = args[0] || process.platform
    let arch = args[1] || process.arch
    let ignore = [...IGNORE]

    let icon = platform === 'win32' ?
      join(res, 'icons', channel, `${name}.ico`) :
      join(res, 'icons', channel, `${name}.icns`)

    say(`packaging for ${platform} ${arch}...`)

    let extraResource = (platform !== 'darwin') ? [] : [
      join(res, 'icons', 'mime', 'tpy.icns'),
      join(res, 'icons', 'mime', 'ttp.icns')
    ]

    let dst = await packager({
      platform,
      arch,
      icon,
      dir,
      out: join(dir, 'dist'),
      name: qualified.product,
      prune: false,
      overwrite: true,
      quiet: true,
      ignore,
      electronVersion: electron.version,
      appVersion: version,
      appBundleId: 'org.tropy.tropy',
      helperBundleId: 'org.tropy.tropy-helper',
      appCategoryType: 'public.app-category.productivity',
      appCopyright:
        `Copyright (c) 2015-${new Date().getFullYear()} ` +
        `${RRCHNM}. All rights not expressly granted are reserved.`,
      extendInfo: join(res, 'darwin', 'info.plist'),
      extraResource,
      darwinDarkModeSupport: true,
      win32metadata: {
        CompanyName: RRCHNM,
        ProductName: qualified.product
      },
      asar: {
        unpack: `**/{${[
          'lib/{node,vendor}/**/*',
          'res/{icons,views}/**/*'
        ].join(',')}}`
      }

    })

    dst = String(dst)

    switch (platform) {
      case 'linux': {
        let unpacked = join(dst, 'resources', 'app.asar.unpacked')

        if (test('-d', unpacked)) {
          say('fix unpacked symlinks...')
          cp('-r', join(dir, SHARP, '*'), join(unpacked, SHARP))
        }

        say(`rename executable to ${qualified.name}...`)
        rename(dst, qualified.product, qualified.name)

        say('create .desktop file...')
        desktop().to(join(dst, `${qualified.name}.desktop`))

        say('copy icons...')
        copyIcons(dst)

        say('copy mime types...')
        mkdir('-p', join(dst, 'mime', 'packages'))
        cp(join(res, 'mime', '*.xml'), join(dst, 'mime', 'packages'))

        say('copy installation instructions...')
        cp(join(res, 'INSTALL'), dst)

        break
      }
      case 'darwin': {
        let unpacked = join(dst,
            `${qualified.product}.app`,
            'Contents',
            'Resources',
            'app.asar.unpacked')

        if (test('-d', unpacked)) {
          say('fix unpacked symlinks...')
          cp('-r', join(dir, SHARP, '*'), join(unpacked, SHARP))
        }
        break
      }
      case 'win32': {
        say('removing duplicate DLLs...')
        rm(join(dst, 'resources', 'app.asar.unpacked', SHARP, '*.dll'))

        say(`renaming executable to ${qualified.name}.exe...`)
        rename(dst, `${qualified.product}.exe`, `${qualified.name}.exe`)
      }
    }

    say(`saved app to ${relative(dir, dst)}`)

  } catch (err) {
    error(err)
  }
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

function desktop() {
  return `#!/usr/bin/env xdg-open
[Desktop Entry]
Version=1.0
Terminal=false
Type=Application
Name=${qualified.product}
Exec=${qualified.name} %u
Icon=${qualified.name}
MimeType=application/vnd.tropy.tpy;x-scheme-handler/tropy;${
  Object.keys(SUPPORTED).join(';')
};
Categories=Graphics;Viewer;Science;`
}

module.exports = {
  RRCHNM
}
