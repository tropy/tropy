'use strict'

const { basename, dirname, resolve, join } = require('path')
const { app, shell } = require('electron')
const { sync: rm } = require('rimraf')
const ChildProcess = require('child_process')
const { existsSync: exists } = require('fs')
const { sync: mkdir } = require('mkdirp')
const { product, qualified } = require('../common/release')

const BASE = resolve(
  app.getPath('appData'), '..', 'Roaming', 'Microsoft'
)
const START_MENU = resolve(
  BASE, 'Start Menu', 'Programs', product, `${qualified.product}.lnk`
)
const DESKTOP = resolve(
  BASE, 'Desktop', `${qualified.product}.lnk`
)

const root = resolve(process.execPath, '..', '..')
const update = join(root, 'Update.exe')
const exe = basename(process.execPath)

function link(path, force = false) {
  if (!exists(path) && !force) return

  mkdir(dirname(path))
  shell.writeShortcutLink(path, exists(path) ? 'update' : 'create', {
    target: update,
    args: `--processStart "${exe}"`,
    icon: process.execPath,
    iconIndex: 0,
    appUserModelId: 'org.tropy.app'
  })
}

// eslint-disable-next-line no-unused
function spawn(cmd, ...args) {
  try {
    return ChildProcess.spawn(cmd, args, { detached: true })

  } catch (error) {
    app.quit(1)
  }
}

function handleSquirrelEvent() {
  if (process.platform !== 'win32') return false
  if (global.ARGS.environment === 'development') return false
  if (process.argv.length === 1) return false

  switch (process.argv[1]) {
    case '--squirrel-install':
      link(DESKTOP, true)
      link(START_MENU, true)
      app.quit
      break
    case '--squirrel-updated':
      link(DESKTOP)
      link(START_MENU)
      app.quit
      break
    case '--squirrel-uninstall':
      try {
        rm(DESKTOP)
        rm(START_MENU)
        rm(app.getPath('userData'))

      } finally {
        app.quit()
      }
      break
    case '--squirrel-obsolete':
      app.quit()
      break

    default:
      return false
  }

  return true
}

module.exports = handleSquirrelEvent
