import fs from 'fs'
import { basename, extname, join } from 'path'
import { info } from './log'
import { paths } from './release'

const { readdir: ls, readFile: read } = fs.promises

export class Migration {
  constructor(path) {
    this.path = path
    this.type = extname(path).slice(1)
    this.number = Number(basename(path).split('.', 2)[0])
  }

  static async all(name) {
    let dir = join(paths.db, 'migrate', name)

    return (await ls(dir))
      .filter(migration => (/^\d+[\w.-]*\.(js|sql)$/).test(migration))
      .sort()
      .map(migration => new Migration(join(dir, migration)))
  }

  static async since(number = 0, name) {
    return (await this.all(name)).filter(m => m.fresh(number))
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
