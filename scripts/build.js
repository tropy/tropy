#!/usr/bin/env node
'use strict'

const { say, error } = require('./util')('Σ')
const legal = require('./legal')
const { copyFile, mkdir, readdir, rename, writeFile } = require('fs').promises
const { program } = require('commander')
const packager = require('electron-packager')
const minimatch = require('minimatch')
const { basename, extname, join, relative } = require('path')

const {
  ROOT,
  ICONS,
  author,
  channel,
  exe,
  name,
  version,
  qualified
} = require('./metadata')

const ARCH =
  process.env.npm_config_target_arch ||
  process.env.npm_config_arch ||
  process.arch
const PLATFORM =
  process.env.npm_config_target_platform ||
  process.env.npm_config_platform ||
  process.platform


program
  .name('tropy-build')
  .option('--platform <name>', 'set target platform', PLATFORM)
  .option('--arch <name>', 'set target arch', ARCH)
  .option('--no-asar', 'skip asar creation')

if (process.platform === 'darwin') {
  program
    .option('-c, --cert <id>',
      'set sigining certificate',
      process.env.SIGN_CERT)
    .option(
      '-u, --user <apple-id>',
      'set Apple Id for notarization',
      process.env.SIGN_USER)
    .option(
      '-p, --password <password>',
      'set the Apple Id password',
      '@keychain:TROPY_DEV_PASSWORD')
}

program
  .action(async () => {
    try {
      let args = program.opts()
      let opts = configure(args)
      say(`building for ${opts.platform} ${opts.arch}`)

      if (process.platform === 'darwin') {
        mergeMacSigningOptions(opts, args)
      }

      if (!args.asar) {
        opts.asar = false
      }

      let [dest] = await packager(opts)

      say('compiling LICENSE and third-party notices')
      await copyFile(join(ROOT, 'LICENSE'), join(dest, 'LICENSE'))

      await rename(
        join(dest, 'LICENSES.chromium.html'),
        join(dest, 'LICENSE.chromium.html'))

      let deps = await legal.loadDependencies()
      let licenses = legal.compileThirdPartyNotices(deps, { format: 'txt' })
      await writeFile(join(dest, 'LICENSE.third-party.txt'), licenses)

      switch (opts.platform) {
        case 'linux': {
          let resources = join(dest, 'resources')

          say('create .desktop file')
          await writeFile(
            join(dest, `${qualified.name}.desktop`),
            desktop())

          say('make shared icons')
          copyIcons(join(resources, 'icons'))

          say('copy mime-db')
          await mkdir(join(resources, 'mime', 'packages'), { recursive: true })
          await copyFile(
            join(ROOT, 'res', 'mime', 'tropy.xml'),
            join(resources, 'mime', 'packages', 'tropy.xml'))

          say('copy INSTALL instructions')
          await copyFile(
            join(ROOT, 'res', 'INSTALL'),
            join(dest, 'INSTALL'))

          break
        }
      }

      say(`saved as "./${relative(ROOT, dest)}"`)

    } catch (e) {
      error(e)
      console.error(e.stack)
    }
  })


function configure({ arch, platform, out = join(ROOT, 'dist') }) {
  // NB: the patterns must include (sub-)directories!
  const INCLUDE = [
    '/db{,/{migrate,schema}{,/**/*}}',
    '/lib{,/**/*}',
    '/res{,/{menu,shaders,cursors,images,keymaps,strings,views,workers}{,/**/*}}',
    '/res/icons{,/{about,colors,cover,project,wizard,window}{,/**/*}}',
    '/package.json'
  ]

  const EXCLUDE = [
    '/lib/licenses.*.json',
    '/lib/**/*.map'
  ]

  const ignore = (path) => !(
    path === '' || (
      INCLUDE.some(pattern => minimatch(path, pattern)) &&
      !EXCLUDE.some(pattern => minimatch(path, pattern))
    )
  )

  let icon = null
  let extraResource = []
  let executableName

  switch (platform) {
    case 'linux':
      INCLUDE.push(`/res/icons/${channel}{,/tropy{,/**/*}}`)
      executableName = qualified.name
      break
    case 'darwin':
      icon = join(ROOT, 'res', 'icons', channel, `${name}.icns`)
      extraResource.push(join(ICONS, 'mime', 'tpy.icns'))
      extraResource.push(join(ICONS, 'mime', 'ttp.icns'))
      break
    case 'win32':
      icon = join(ICONS, channel, `${name}.ico`)
      extraResource.push(icon)
      extraResource.push(join(ICONS, 'mime', 'tpy.ico'))
      extraResource.push(join(ICONS, 'mime', 'ttp.ico'))
      executableName = qualified.name
      break
  }

  return {
    platform,
    arch,
    icon,
    dir: ROOT,
    out,
    name: qualified.product,
    executableName,
    derefSymlinks: true,
    prune: false,
    overwrite: true,
    quiet: true,
    ignore,
    junk: true,
    appVersion: version,
    appBundleId: 'org.tropy.tropy',
    helperBundleId: 'org.tropy.tropy-helper',
    appCategoryType: 'public.app-category.productivity',
    appCopyright:
      `Copyright (c) 2015-${new Date().getFullYear()} ` +
      `${author}. All rights not expressly granted are reserved.`,
    extendInfo: join(ROOT, 'res', 'darwin', 'info.plist'),
    extraResource,
    darwinDarkModeSupport: true,
    win32metadata: {
      CompanyName: author,
      ProductName: qualified.product
    },
    asar: {
      unpack: `**/{${[
        'lib/{node,vendor}/**/*',
        'res/{icons,keymaps,views}/**/*'
      ].join(',')}}`
    }
  }
}

function mergeMacSigningOptions(opts, args) {
  if (args.cert) {
    let entitlements = join(ROOT, 'res', 'darwin', 'entitlements.plist')

    opts.osxSign = {
      'identity': args.cert,
      'type': channel === 'alpha' ? 'development' : 'distribution',
      'platform': args.platform,
      'hardened-runtime': true,
      'entitlements': entitlements,
      'entitlements-inherit': entitlements
    }

    if (args.user) {
      opts.osxNotarize = {
        appleId: args.user,
        appleIdPassword: args.password,
        ascProvider: 'CorporationforDigitalScholarship'
      }

      say('will attempt code-signing and app-notarization')

    } else {
      say('will attempt code-signing')
    }
  } else {
    say('skipped code-signing')
  }
}

async function copyIcons(dst, theme = 'hicolor') {
  let icons = await readdir(join(ICONS, channel, 'tropy'))
  for (let icon of icons) {
    let ext = extname(icon)
    let variant = basename(icon, ext)
    let target = join(dst, theme, variant, 'apps')

    let file = (variant === 'symbolic') ?
      `${qualified.name}-symbolic${ext}` : `${qualified.name}${ext}`

    await mkdir(target, { recursive: true })
    await copyFile(join(ICONS, channel, 'tropy', icon), join(target, file))
  }

  for (let type of ['tpy', 'ttp']) {
    icons = await readdir(join(ICONS, 'mime', type))
    for (let icon of icons) {
      let ext = extname(icon)
      let variant = basename(icon, ext)

      if ((/@/).test(variant)) continue

      let target = join(dst, theme, variant, 'mimetypes')
      let file = `application-vnd.tropy.${type}${ext}`

      await mkdir(target, { recursive: true })
      await copyFile(join(ICONS, 'mime', type, icon), join(target, file))
    }
  }
}

function desktop({
  icon = exe,
  mimetypes = [
    'application/vnd.tropy.tpy',
    'application/vnd.tropy.ttp',
    'x-scheme-handler/tropy'
  ]
} = {}) {
  return `#!/usr/bin/env xdg-open
[Desktop Entry]
Version=1.0
Terminal=false
Type=Application
Name=${qualified.product}
Exec=${exe} %u
Icon=${icon}
MimeType=${mimetypes.join(';')};
Categories=Graphics;Viewer;Science;`
}

if (require.main === module) {
  program.parseAsync(process.argv)
}

module.exports = {
  configure,
  desktop
}
