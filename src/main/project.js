import { join } from 'node:path'
import { platform } from 'node:process'
import { pathToFileURL } from 'node:url'
import { spawn } from '../common/spawn.js'
import { warn } from '../common/log.js'

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
