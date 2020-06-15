'use strict'

const { into, update } = require('../common/query')

module.exports = {
  async open(db, { uuid, version } = ARGS) {
    let { id } = await db.run(
      ...into('access')
        .insert({
          path: db.path,
          uuid,
          version
        }))

    return id
  },

  close(db, id) {
    return db.run(
      ...update('access')
        .set('closed = datetime("now")')
        .where({ rowid: id }))
  },

  prune(db) {
    return db.run(`
      DELETE FROM access
        WHERE rowid <= (
          SELECT rowid FROM (
            SELECT rowid FROM access ORDER BY rowid DESC LIMIT 1 OFFSET 99
          )
        )`
    )
  }
}
