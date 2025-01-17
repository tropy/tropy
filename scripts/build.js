#!/usr/bin/env node

import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  unlink,
  writeFile
} from 'node:fs/promises'

import { homedir } from 'node:os'
import { basename, extname, join, relative } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { program } from 'commander'
import { packager } from '@electron/packager'
import { minimatch } from 'minimatch'
import { ROOT, ICONS, error, say, setLogSymbol } from './util.js'
import * as legal from './legal.js'

import {
  appId,
  author,
  channel,
  exe,
  name,
  version,
  qualified
} from '../src/common/release.js'

setLogSymbol('Σ')

const ARCH =
  process.env.npm_config_target_arch ||
  process.env.npm_config_arch ||
  process.arch
const PLATFORM =
  process.env.npm_config_target_platform ||
  process.env.npm_config_platform ||
  process.platform

const ELECTRON = join(ROOT, 'node_modules', 'electron', 'dist')


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
      '-K, --keychain <keychain>',
      'set the keychain name',
      process.env.SIGN_KEYCHAIN)

    .option(
      '-u, --user <apple-id>',
      'set Apple Id for notarization',
      process.env.SIGN_USER)
    .option(
      '-p, --password <password>',
      'set the Apple Id password',
      '@keychain:TROPY_DEV_PASSWORD')

    .option(
      '-k, --api-key <key>',
      'set Apple API key ID for notarization',
      process.env.NOTARY_KEY_ID)
    .option(
      '-I, --api-key-issuer <issuer>',
      'set Apple API issuer ID for notarization',
      process.env.NOTARY_KEY_ISSUER)
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

      switch (opts.platform) {
        case 'linux': {
          let resources = join(dest, 'resources')

          say('create .desktop file')
          await writeFile(`${dest}/${qualified.appId}.desktop`, desktop())

          say('make shared icons')
          copyIcons(`${resources}/icons`)

          say('copy mime-db')
          await mkdir(`${resources}/mime/packages`, { recursive: true })
          await copyFile(
            `${ROOT}/res/mime/tropy.xml`,
            `${resources}/mime/packages/${appId}.xml`)

          say('copy metainfo.xml')
          await copyFile(
            `${ROOT}/res/linux/org.tropy.Tropy.metainfo.xml`,
            `${dest}/${appId}.metainfo.xml`)

          say('copy INSTALL instructions')
          await copyFile(`${ROOT}/res/linux/INSTALL`, `${dest}/INSTALL`)

          await copyLicense(dest)

          break
        }
        case 'win32':
          await copyLicense(dest)
          break
      }

      say(`saved as "./${relative(ROOT, dest)}"`)

    } catch (e) {
      error(e)
      console.error(e.stack)
    }
  })


export function configure({ arch, platform, out = join(ROOT, 'dist') }) {
  // NB: the patterns must include (sub-)directories!
  const INCLUDE = [
    '/db{,/{migrate,schema}{,/**/*}}',
    '/lib{,/**/*}',
    '/res{,/{menu,shaders,cursors,images,plugins,keymaps,strings,views,workers}{,/**/*}}',
    '/res/icons{,/{about,colors,cover,mime,prefs,project,window}{,/**/*}}',
    '/package.json',
    '/LICENSE'
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
      extraResource.push(icon)
      extraResource.push(join(ICONS, 'mime', 'mtpy.icns'))
      extraResource.push(join(ICONS, 'mime', 'tpy.icns'))
      extraResource.push(join(ICONS, 'mime', 'ttp.icns'))
      break
    case 'win32':
      icon = join(ICONS, channel, `${name}.ico`)
      extraResource.push(icon)
      // extraResource.push(join(ICONS, 'mime', 'mtpy.ico'))
      extraResource.push(join(ICONS, 'mime', 'tpy.ico'))
      extraResource.push(join(ICONS, 'mime', 'ttp.ico'))
      extraResource.push(join(ICONS, 'mime', 'folder.ico'))
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
    afterCopy: [
      addExtraMetadata,
      addLicense
    ],
    appVersion: version,
    appBundleId: qualified.appId.toLowerCase(),
    helperBundleId: `${qualified.appId.toLowerCase()}-helper`,
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
        'res/{icons,keymaps,plugins,views}/**/*',
        'package.json',
        'LICENSE*'
      ].join(',')}}`
    }
  }
}


async function addExtraMetadata(buildPath, v, platform, arch, done) {
  say('tagging package.json for release')
  let pkg = JSON.parse(await readFile(join(buildPath, 'package.json')))

  delete pkg.scripts
  delete pkg.dependencies
  delete pkg.devDependencies
  delete pkg.optionalDependencies

  pkg.build = {
    electron: v,
    platform,
    arch
  }

  await writeFile(join(buildPath, 'package.json'), JSON.stringify(pkg, null, 2))
  done()
}

async function addLicense(buildPath, v, platform, arch, done) {
  say('compiling LICENSE and third-party notices')

  await copyFile(
    join(ELECTRON, 'LICENSES.chromium.html'),
    join(buildPath, 'LICENSE.chromium.html'))

  let deps = await legal.loadDependencies()
  let licenses = legal.compileThirdPartyNotices(deps, { format: 'txt' })
  await writeFile(join(buildPath, 'LICENSE.third-party.txt'), licenses)
  done()
}

async function copyLicense(dest) {
  say('copy LICENSE')
  await copyFile(`${ROOT}/LICENSE`, `${dest}/LICENSE`)
  await unlink(`${dest}/LICENSES.chromium.html`)
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
      'entitlements-inherit': entitlements,
      'keychain': args.keychain
    }

    say('will attempt code-signing')

    if (args.user) {
      opts.osxNotarize = {
        appleId: args.user,
        appleIdPassword: args.password,
        ascProvider: 'CorporationforDigitalScholarship'
      }

      say('will attempt app-notarization using password')

    } else if (args.apiKey) {
      opts.osxNotarize = {
        appleApiKeyId: args.apiKey,
        appleApiKey:
          join(homedir(), '.private_keys', `AuthKey_${args.apiKey}.p8`),
        appleApiIssuer: args.apiKeyIssuer
      }

      say('will attempt app-notarization using api key')
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
      `${qualified.appId}-symbolic${ext}` : `${qualified.appId}${ext}`

    await mkdir(target, { recursive: true })
    await copyFile(join(ICONS, channel, 'tropy', icon), join(target, file))
  }

  for (let type of ['mtpy', 'tpy', 'ttp']) {
    icons = await readdir(join(ICONS, 'mime', type))
    for (let icon of icons) {
      let ext = extname(icon)
      let variant = basename(icon, ext)

      if ((/@/).test(variant)) continue

      let target = join(dst, theme, variant, 'mimetypes')
      let file = `${appId}.${type}${ext}`

      await mkdir(target, { recursive: true })
      await copyFile(join(ICONS, 'mime', type, icon), join(target, file))
    }
  }
}

export function desktop({
  icon = qualified.appId,
  mimetypes = [
    'application/vnd.tropy.tropy',
    'application/vnd.tropy.mtpy',
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
Comment=Research photo management
Exec=${exe} %U
Icon=${icon}
MimeType=${mimetypes.join(';')};
Categories=Graphics;Viewer;Science;`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  program.parseAsync(process.argv)
}
