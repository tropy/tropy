import { join } from 'path'
import fs from 'fs'
import { info, warn } from '../common/log'

const createMigration = (name, v, up) => ({ name, v, up })

const mv = async (oldPath, newPath, name = oldPath) => {
  try {
    await fs.promises.rename(oldPath, newPath)

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
