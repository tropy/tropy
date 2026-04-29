import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import write from 'write-file-atomic'

export class Storage {
  constructor (path) {
    this.path = path
  }

  async load (name, defaults) {
    try {
      return {
        ...defaults,
        ...this.parse(await readFile(this.expand(name)))
      }
    } catch (error) {
      if (defaults != null && error.code === 'ENOENT')
        return { ...defaults }
      else throw error
    }
  }

  save (name, object) {
    return write.sync(this.expand(name), JSON.stringify(object))
  }

  parse (data) {
    return JSON.parse(data, (k, v) =>
      (k === '__proto__') ? undefined : v
    )
  }

  expand (name) {
    return join(this.path, name)
  }
}
