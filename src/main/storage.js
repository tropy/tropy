import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { safeStorage } from 'electron'
import write from 'write-file-atomic'
import { trace, warn } from '../common/log.js'

export class Storage {
  constructor (path) {
    this.path = path
  }

  async load (name, { defaults, secure = false } = {}) {
    try {
      return {
        ...defaults,
        ...this.parse(await readFile(this.expand(name)), { secure })
      }
    } catch (error) {
      if (defaults != null && error.code === 'ENOENT')
        return { ...defaults }
      else
        throw error
    }
  }

  save (name, data, { secure = false } = {}) {
    let string = JSON.stringify(data)

    if (secure) {
      if (safeStorage.isEncryptionAvailable()) {
        string = safeStorage.encryptString(string)
      } else {
        warn(`storage: no encryption available, ${name} was not saved`)
        return
      }
    }

    write.sync(this.expand(name), string)
    trace(`storage: ${name} saved`)
  }

  parse (data, { secure = false } = {}) {
    if (secure) {
      if (safeStorage.isEncryptionAvailable()) {
        data = safeStorage.decryptString(data)
      } else {
        warn('storage: no encryption available')
        return
      }
    }

    return JSON.parse(data, (k, v) =>
      (k === '__proto__') ? undefined : v
    )
  }

  expand (name) {
    return join(this.path, name)
  }
}
