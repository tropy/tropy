import { join } from 'path'
import fs from 'fs'
import write from 'write-file-atomic'

export class Storage {
  constructor(path) {
    this.path = path
    this.save.sync = (name, object) =>
      write.sync(this.expand(name), JSON.stringify(object))
  }

  async load(name, defaults) {
    try {
      return {
        ...defaults,
        ...JSON.parse(await fs.promises.readFile(this.expand(name)))
      }
    } catch (error) {
      if (defaults != null && error.code === 'ENOENT')
        return { ...defaults }
      else throw error
    }
  }

  async save(name, object) {
    return write(this.expand(name), JSON.stringify(object))
  }

  expand(name) {
    return join(this.path, name)
  }
}
