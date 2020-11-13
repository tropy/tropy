import { basename, dirname, join } from 'path'
import { app, shell } from 'electron'
// import ChildProcess from 'child_process'
import { existsSync, mkdirSync, rmdirSync } from 'fs'
import { product, qualified } from '../common/release'

function rm(path) {
  rmdirSync(path, { recursive: true, maxRetries: 3 })
}

const START_MENU = join(
  app.getPath('appData'),
  '..',
  'Roaming',
  'Microsoft',
  'Windows',
  'Start Menu',
  'Programs',
  product,
  `${qualified.product}.lnk`
)

const DESKTOP = join(
  app.getPath('home'),
  'Desktop',
  `${qualified.product}.lnk`
)

const root = join(process.execPath, '..', '..')
const mime = join(process.execPath, '..', 'res', 'icons', 'mime')
const update = join(root, 'Update.exe')
const exe = basename(process.execPath)

function link(path, force = false) {
  if (!existsSync(path) && !force) return

  mkdirSync(dirname(path), { recursive: true })
  shell.writeShortcutLink(path, existsSync(path) ? 'update' : 'create', {
    target: update,
    args: `--processStart "${exe}"`,
    icon: process.execPath,
    iconIndex: 0,
    appUserModelId: 'org.tropy.app'
  })
}

function registry(reg, cmd, ...args) {
  return Promise((resolve, reject) => {
    reg[cmd](...args, (err, ...res) => {
      if (err != null) reject(err)
      else resolve(...res)
    })
  })
}


async function setMimeType(...types) {
  const Registry = await import('winreg')
  const { DEFAULT_VALUE, HKCU, REG_SZ } = Registry

  return Promise.all(types.map(async type => {
    let icon = join(mime, `${type}.ico`)
    let key = `\\Software\\Classes\\.${type}`
    let reg = new Registry({ hive: HKCU, key })

    await registry(reg, 'set', DEFAULT_VALUE, REG_SZ, qualified.product)

    key = `${key}\\DefaultIcon`
    reg = new Registry({ hive: HKCU, key })

    await registry(reg, 'set', DEFAULT_VALUE, REG_SZ, icon)
  }))
}

async function clearMimeType(...types) {
  const Registry = await import('winreg')
  const { HKCU } = Registry

  return Promise.all(types.map(async type => {
    const key = `\\Software\\Classes\\.${type}`
    const reg = new Registry({ hive: HKCU, key })
    await registry(reg, 'clear')
  }))
}

//async function spawn(cmd, ...args) {
//  try {
//    return ChildProcess.spawn(cmd, args, { detached: true })
//  } catch (error) {
//    app.quit(1)
//  }
//}

export function handleSquirrelEvent(type, opts) {
  switch (type) {
    case '--squirrel-install':
      return handleInstall()

    case '--squirrel-updated':
      return handleUpdated()

    case '--squirrel-uninstall':
      return handleUninstall(opts)

    case '--squirrel-obsolete':
      return Promise.resolve()

    default:
      return null
  }
}

async function handleInstall() {
  link(DESKTOP, true)
  link(START_MENU, true)
  await setMimeType('tpy', 'ttp')
}

async function handleUpdated() {
  link(DESKTOP)
  link(START_MENU)
}

async function handleUninstall(opts = {}) {
  try {
    rm(DESKTOP)
    rm(START_MENU)
    if (opts.logs) rm(opts.logs)
    if (opts.cache) rm(opts.cache)
    if (opts.data) rm(opts.data)

  } finally {
    await clearMimeType('tpy', 'ttp')
  }
}
