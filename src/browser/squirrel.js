'use strict'

function handleSquirrelEvent() {
  if (process.platform !== 'win32') return false
  if (process.argv.length === 1) return false

  const ChildProcess = require('child_process')
  const { basename, resolve, join } = require('path')
  const { app } = require('electron')

  const root = resolve(process.execPath, '..', '..')
  const update = join(root, 'Update.exe')
  const exe = basename(process.execPath)

  function spawn(cmd, ...args) {
    try {
      return ChildProcess.spawn(cmd, args, { detached: true })

    } catch (error) {
      app.quit(1)
    }
  }

  function delay(fn, by = 1000) {
    return setTimeout(fn, by)
  }

  switch (process.argv[1]) {
    case '--squirrel-install':
    case '--squirrel-updated':
      spawn(update, '--createShortcut', exe)
      delay(app.quit)
      break
    case '--squirrel-uninstall':
      spawn(update, '--removeShortcut', exe)
      delay(app.quit)
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
