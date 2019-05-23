'use strict'

const { mktmp } = require('./tmp')
const { rm } = require('./rm')
const { Database } = __require('common/db')

module.exports = {
  mkdbtmp(callback, filename = 'db_test.sqlite', ...args) {
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
      await rm(file)
    })
  }
}
