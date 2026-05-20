import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { safeStorage } from 'electron'
import write from 'write-file-atomic'
import { trace, warn } from '../common/log.js'

const encrypt = async (string) => {
  if (!(await safeStorage.isAsyncEncryptionAvailable())) {
    throw new Error('no encryption available')
  }
  return await safeStorage.encryptStringAsync(string)
}

const decrypt = async (data) => {
  if (!(await safeStorage.isAsyncEncryptionAvailable())) {
    throw new Error('no encryption available')
  }
  return (await safeStorage.decryptStringAsync(data)).result
}

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
      try {
        string = await encrypt(string)
      } catch (err) {
        warn({ err }, `storage: encryption failed, skip saving ${name}`)
        return
      }
    }

    write.sync(this.expand(name), string)
    trace(`storage: ${name} saved`)
  }

  async parse (data, { secure = false } = {}) {
    if (secure) {
      try {
        data = await decrypt(data)
      } catch (err) {
        warn({ err }, 'storage: decryption failed, skip parsing data')
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
