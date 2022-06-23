import { readdir as ls, readFile as read } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { info } from './log.js'


export class Migration {
  constructor(path) {
    this.path = path
    this.type = extname(path).slice(1)
    this.number = Number(basename(path).split('.', 2)[0])
  }

  static async all(dir) {
    return (await ls(dir))
      .filter(migration => (/^\d+[\w.-]*\.(js|sql)$/).test(migration))
      .sort()
      .map(migration => new Migration(join(dir, migration)))
  }

  static async since(number = 0, dir) {
    return (await this.all(dir)).filter(m => m.fresh(number))
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
