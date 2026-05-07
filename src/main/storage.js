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
      let buffer = await readFile(this.expand(name))
      let data = await this.parse(buffer, { secure })

      return {
        ...defaults,
        ...data
      }
    } catch (error) {
      if (defaults != null && error.code === 'ENOENT')
        return { ...defaults }
      else
        throw error
    }
  }

  async save (name, data, { secure = false } = {}) {
    let string = JSON.stringify(data)

    if (secure) {
      if (await safeStorage.isAsyncEncryptionAvailable()) {
        string = await safeStorage.encryptStringAsync(string)
      } else {
        warn(`storage: no encryption available, skip saving ${name}`)
        return
      }
    }

    await write(this.expand(name), string)
    trace(`storage: ${name} saved`)
  }

  async parse (data, { secure = false } = {}) {
    if (secure) {
      if (await safeStorage.isAsyncEncryptionAvailable()) {
        data = (await safeStorage.decryptStringAsync(data)).result
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
