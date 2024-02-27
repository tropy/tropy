import { URL, fileURLToPath } from 'node:url'
import { ipcMain, shell } from 'electron'
import { error } from '../common/log.js'

export async function open(target) {
  let { path, protocol } = parse(target)

  if (protocol === 'file') {
    let err = await shell.openPath(path)
    if (err) error(`failed to open ${path}: ${err}`)
  } else {
    await shell.openExternal(`${protocol}://${path}`)
  }
}

export async function show(target) {
  let { path, protocol } = parse(target)

  if (protocol === 'file') {
    shell.showItemInFolder(path)
  } else {
    await shell.openExternal(`${protocol}://${path}`)
  }
}

function parse(target) {
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

export async function trash(path) {
  await shell.trashItem(path)
}

export function start() {
  ipcMain.on('shell', handler)
}

export function stop() {
  ipcMain.removeListener('shell', handler)
}

async function handler(event, cmd, ...args) {
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
