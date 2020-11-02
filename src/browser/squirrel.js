import { basename, join, resolve } from 'path'
import ChildProcess from 'child_process'
import fs from 'fs'
import { homedir } from 'os'
import { product } from '../common/release'
import { ShellOption } from './win-shell'

const appFolder = resolve(process.execPath, '..')
const rootAppDir = resolve(appFolder, '..')
const updateDotExe = join(rootAppDir, 'Update.exe')
const exeName = basename(process.execPath)


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

    case '--squirrel-firstrun':
      return null

    default:
      return null
  }
}

async function handleInstall() {
  await createShortcut(['StartMenu', 'Desktop'])
  await registerApplication()
}

async function handleUpdated() {
  await updateShortcut()
  await registerApplication()
}

async function handleUninstall(opts = {}) {
  await removeShortcut()
  await clearAppRegistration()
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
    let desktopShortcut = join(home, 'Desktop', `${product}.lnk`)

    if (!fs.existsSync(desktopShortcut))
      locations = ['StartMenu']
  }

  return createShortcut(locations)
}

function removeShortcut() {
  return spawn(updateDotExe, ['--removeShortcut', exeName])
}

async function registerApplication() {
  let exe = process.execPath
  let res = join(appFolder, 'resources')

  await ShellOption
    .forAppPath(exe)
    .register()

  await ShellOption
    .forApplication(exe, join(res, 'tropy.ico'), ['.tpy'])
    .register()

  await ShellOption
    .forProgId('Tropy.Project', exe, join(res, 'tpy.ico'))
    .register()

  await ShellOption
    .forProgId('Tropy.Template', exe, join(res, 'ttp.ico'))
    .register()

  await ShellOption
    .forFileExtension('.tpy', 'Tropy.Project', 'application/vnd.tropy.tpy')
    .register()

  await ShellOption
    .forFileExtension('.ttp', 'Tropy.Template', 'application/vnd.tropy.ttp')
    .register()
}

async function clearAppRegistration() {
  let exe = process.execPath

  await ShellOption.forAppPath(exe).clear()
  await ShellOption.forApplication(exe).clear()
  await ShellOption.forProgId('Tropy.Project').clear()
  await ShellOption.forProgId('Tropy.Template').clear()
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
