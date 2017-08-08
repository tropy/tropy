'use strict'

require('./promisify')

const { readdirAsync: ls, readFileAsync: read } = require('fs')
const { basename, extname, join } = require('path')
const { info } = require('./log')


class Migration {
  constructor(path) {
    this.path = path
    this.type = extname(this.path).slice(1)
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
    info(`migrating ${db.path} to #${this.number}`)

    return db
      .migration(async (tx) => {
        if (this.type === 'js') {
          await require(this.path).up(tx)
        } else {
          await tx.exec(String(await read(this.path)))
        }

        await tx.version(this.number)
      })

      .catch(error => {
        throw new Error(`Migration #${this.number} failed: ${error.message}`)
      })
  }

  fresh(number) {
    return !number || this.number > number
  }
}

module.exports =  { Migration }
