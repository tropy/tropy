import { mktmp } from './tmp'
import { unlink } from 'fs/promises'
import { Database } from '../../src/common/db'

export function mkdbtmp(callback, filename = 'db_test.sqlite', ...args) {
  let db
  let file = mktmp(filename)

  beforeEach(async () => {
    if (args.length > 0)
      await Database.create(file, ...args)

    db = new Database(file)
    return callback(db)
  })

  afterEach(async () => {
    await db.close()
    await unlink(file)
  })
}
