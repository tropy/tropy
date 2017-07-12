'use strict'

module.exports = {
  async open(db) {
    const { id } = await db.run(`
      INSERT INTO access (uuid, version) VALUES (?, ?)`,
      ARGS.uuid, ARGS.version
    )

    return id
  },

  close(db, id) {
    return db.run(`
      UPDATE access
        SET closed = datetime("now")
        WHERE rowid = ?`, id
    )
  },

  prune(db) {
    return db.run(`
      DELETE FROM access
        WHERE rowid <= (
          SELECT rowid FROM (
            SELECT rowid FROM access ORDER BY rowid DESC LIMIT 1 OFFSET 9
          )
        )`
    )
  }
}
