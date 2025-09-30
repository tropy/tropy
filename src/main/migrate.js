import { join } from 'node:path'
import fs from 'node:fs'
import { rename } from 'node:fs/promises'
import { info, warn } from '../common/log.js'
import { channel } from '../common/release.js'
import { win32 } from '../common/os.js'

const createMigration = (name, v, up) => ({ name, v, up })

const mv = async (oldPath, newPath, name = oldPath) => {
  try {
    await rename(oldPath, newPath)

  } catch (e) {
    switch (e.code) {
      case 'ENOTEMPTY':
      case 'ENOENT':
      case 'EPERM':
        warn(`failed to move ${name}: ${e.code} ${e.message}`)
        break
      default:
        throw e
    }
  }
}

export const MIGRATIONS = [
  createMigration('local-storage', [1, 5], async (tropy) => {
    let oldLocalStorage = join(tropy.opts.data, 'Local Storage')
    if (fs.existsSync(oldLocalStorage)) {
      await mv(
        oldLocalStorage,
        join(tropy.opts.data, 'electron', 'Local Storage'),
        'local storage')
    }
  }),

  createMigration('user-cache', [1, 5], async (tropy) => {
    let oldCacheRoot = join(tropy.opts.data, 'cache')
    if (tropy.cache.root !== oldCacheRoot) {
      if (fs.existsSync(oldCacheRoot)) {
        await mv(oldCacheRoot, tropy.cache.root, 'cache folder')
      }
    }
  }),

  createMigration('win32-custom-titlebar', [1, 15], async (_, state) => {
    if (win32) {
      state.frameless = true
    }
  }),

  createMigration('api-default-port', [1, 17], async (tropy, state) => {
    if (state.port === 2019 && channel !== 'latest') {
      state.port = 2029
    }
  })
]

export async function migrate(tropy, state, version = tropy.version) {
  let [major, minor] = version.split('.')
  for (let m of MIGRATIONS) {
    try {
      if (major <= m.v[0] && minor < m.v[1]) {
        info(`migrate ${m.name}`)
        await m.up(tropy, state)
      }
    } catch (e) {
      warn({ stack: e.stack }, `migration ${m.name} failed`)
    }
  }
}
