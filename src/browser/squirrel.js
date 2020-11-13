import { basename, join, resolve } from 'path'
import ChildProcess from 'child_process'
import fs from 'fs'
import { homedir } from 'os'
import { qualified } from '../common/release'

const appFolder = resolve(process.execPath, '..')
const rootAppDir = resolve(appFolder, '..')
const updateDotExe = join(rootAppDir, 'Update.exe')
const exeName = basename(process.execPath)


const mime = join(process.execPath, '..', 'res', 'icons', 'mime')

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
  await createShortcut(['StartMenu', 'Desktop'])
  await setMimeType('tpy', 'ttp')
}

async function handleUpdated() {
  await updateShortcut()
}

async function handleUninstall(opts = {}) {
  await removeShortcut()
  await clearMimeType('tpy', 'ttp')
  await rmdir(opts.logs)
  await rmdir(opts.cache)
  await rmdir(opts.data)
}

function createShortcut(locations) {
  return spawn(updateDotExe, [
    '--createShortcut',
    exeName,
    '-l',
    locations.join(',')
  ])
}

function updateShortcut() {
  let locations = ['StartMenu', 'Desktop']
  let home = homedir()

  if (home) {
    let desktopShortcut = join(home, 'Desktop', `${qualified.product}.lnk`)

    if (!fs.existsSync(desktopShortcut))
      locations = ['StartMenu']
  }

  return createShortcut(locations)
}

function removeShortcut() {
  return spawn(updateDotExe, ['--removeShortcut', exeName])
}

async function rmdir(path) {
  if (path) {
    return fs.promises.rmdir(path, { recursive: true, maxRetries: 3 })
  }
}

async function spawn(cmd, args) {
  try {
    let child = ChildProcess.spawn(cmd, args)

    return new Promise((resolve, reject) => {
      let stdout = ''

      child.stdout?.on('data', data => {
        stdout += data
      })

      child.on('close', code => {
        if (code === 0)
          resolve(stdout)
        else
          reject(new Error(`Command ${cmd} ${args} failed: ${stdout}`))
      })

      child.on('error', error => {
        reject(error)
      })

      // See http://stackoverflow.com/questions/9155289/calling-powershell-from-nodejs
      child.stdin?.end()
    })

  } catch (e) {
    return Promise.reject(e)
  }
}

