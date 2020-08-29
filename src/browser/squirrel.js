import { basename, dirname, join } from 'path'
import { app, shell } from 'electron'
import ChildProcess from 'child_process'
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

// eslint-disable-next-line no-unused-vars
function spawn(cmd, ...args) {
  try {
    return ChildProcess.spawn(cmd, args, { detached: true })
  } catch (error) {
    app.quit(1)
  }
}

function quit() {
  app.quit()
}

export default function handleSquirrelEvent({ data, cache, logs } = {}) {
  if (process.platform !== 'win32') return false
  if (process.env.NODE_ENV === 'development') return false
  if (process.argv.length === 1) return false

  for (let arg of process.argv) {
    switch (arg) {
      case '--squirrel-install':
        link(DESKTOP, true)
        link(START_MENU, true)
        setMimeType('tpy', 'ttp').then(quit, quit)

        return true
      case '--squirrel-updated':
        link(DESKTOP)
        link(START_MENU)
        app.quit()
        return true
      case '--squirrel-uninstall':
        try {
          rm(DESKTOP)
          rm(START_MENU)
          if (logs) rm(logs)
          if (cache) rm(cache)
          if (data) rm(data)

        } finally {
          clearMimeType('tpy', 'ttp').then(quit, quit)
        }
        return true
      case '--squirrel-obsolete':
        app.quit()
        return true
    }
  }

  return false
}
