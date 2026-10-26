import { join } from 'node:path'
import { platform } from 'node:process'
import { URL, fileURLToPath, pathToFileURL } from 'node:url'
import { ipcMain, shell } from 'electron'
import { error, warn } from '../common/log.js'
import { spawn } from '../common/spawn.js'

export async function open (target) {
  let { path, protocol } = parse(target)

  if (protocol === 'file') {
    let err = await shell.openPath(path)
    if (err) error(`failed to open ${path}: ${err}`)
  } else {
    await shell.openExternal(`${protocol}://${path}`)
  }
}

export async function show (target) {
  let { path, protocol } = parse(target)

  if (protocol === 'file') {
    shell.showItemInFolder(path)
  } else {
    await shell.openExternal(`${protocol}://${path}`)
  }
}

function parse (target) {
  let path, protocol

  if (!(target instanceof URL) && target.path) {
    protocol = target.protocol
    path = target.path
  } else {
    [protocol, path] = String(target).split('://', 2)

    if (path == null) {
      protocol = 'file'
      path = target
    } else if (protocol === 'file') {
      path = fileURLToPath(target)
    }
  }

  return { path, protocol }
}

export async function trash (path) {
  await shell.trashItem(path)
}

export async function setProjectFolderIcon (path) {
  switch (platform) {
    case 'linux':
      await gioSetAttribute(path,
        'metadata::custom-icon',
        pathToFileURL(join(path, '.DirIcon')))
      break
    case 'win32':
      await attrib(join(path, 'desktop.ini'), '+S', '+H')
      await attrib(path, '+S')
      break
  }
}

async function gioSetAttribute (path, key, value) {
  try {
    try {
      await spawn('gio', ['set', path, key, value])
    } catch (err) {
      if (err.code === 'ENOENT')
        await spawn('gvfs-set-attribute', [path, key, value])
      else
        throw err
    }
  } catch (err) {
    warn({ err }, `gio: failed to set ${key} on ${path}`)
  }
}

async function attrib (path, ...attrs) {
  try {
    await spawn('attrib.exe', [path, ...attrs])

  } catch (err) {
    warn({ err }, `failed to set attrib ${attrs} on ${path}`)
  }
}

export function start () {
  ipcMain.on('shell', handler)
}

export function stop () {
  ipcMain.removeListener('shell', handler)
}

async function handler (event, cmd, ...args) {
  switch (cmd) {
    case 'open':
      await open(...args)
      break
    case 'show':
      await show(...args)
      break
    case 'trash':
      await trash(...args)
      break
    default:
      error(`unknown shell request ${cmd} received`)
  }
}
