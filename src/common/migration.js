import { readdir as ls, readFile as read } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { info } from './log.js'


export class Migration {

  static async all(dir) {
    return (await ls(dir))
      .filter(migration => (/^\d+[\w.-]*\.(js|sql)$/).test(migration))
      .map(migration => new Migration(join(dir, migration)))
      .sort((a, b) => a.number - b.number)
  }

  static async since(number = 0, dir) {
    return (await Migration.all(dir)).filter(m => m.fresh(number))
  }


  // The Migration Number is a 10-digit number
  // corresponding to the migration's time of creation
  // using the YYMMDDHHMM format.
  #number = 0

  constructor(path) {
    this.path = path
    this.type = extname(path).slice(1)
    this.number = basename(path).split('.', 2)[0]
  }

  get number() {
    return this.#number
  }

  set number(value) {
    if (typeof value === 'string')
      value = Number(value)

    if (typeof value !== 'number' || Number.isNaN(value) || value < 0)
      throw new Error(`Bad migration number: ${value}`)

    this.#number = value
  }

  up(db) {
    info(`migrating ${basename(db.path)} to #${this.number}`)

    return db
      .migration(async (tx) => {
        let { path, type, number } = this

        if (type === 'js') {
          await (await import(path)).up(tx)
        } else {
          await tx.exec(String(await read(path)))
        }

        await tx.version(number)
      })
  }

  fresh(number) {
    return !number || this.number > number
  }
}
