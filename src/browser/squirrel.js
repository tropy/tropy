import { basename, join, resolve } from 'path'
import fs from 'fs'
import { homedir } from 'os'
import { qualified } from '../common/release'
import { spawn } from '../common/spawn'
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
  await rm(opts.logs)
  await rm(opts.cache)
  await rm(opts.data)
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
    // TODO single-release use unqualified!
    let desktopShortcut = join(home, 'Desktop', `${qualified.product}.lnk`)

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



async function rm(path) {
  if (path) {
    return fs.promises.rm(path, { recursive: true, maxRetries: 3 })
  }
}
