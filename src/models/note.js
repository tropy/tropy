'use strict'

module.exports = {

  async create(db, data) {
    const { id } = await db.run(`
      INSERT INTO notes (id, text) VALUES (?,?)`, data.id, data.text
    )

    return module.exports.load(db, [id])
  },

  async load(db, ids) {
    const notes = {}

    if (ids.length) {
      await db.each(`
        SELECT note_id AS note, photos.id AS photo, items.id AS item,
            text, language, modified
          FROM notes
            LEFT OUTER JOIN photos USING (id)
            LEFT OUTER JOIN items USING (id)
          WHERE note_id IN (${ids.join(',')})
            AND deleted IS NULL
          ORDER BY created ASC`,

        ({ note, ...data }) => {
          notes[note] = {
            ...data, id: note, deleted: false
          }
        }
      )
    }

    return notes
  },

  async save(db, { id, text }) {
    return db.run(`
      UPDATE notes
        SET text = ?, modified = datetime("now")
        WHERE note_id = ?`, text, id
    )
  },

  async delete(db, ids) {
    return db.run(`
      UPDATE notes
        SET deleted = datetime("now")
        WHERE note_id IN (${ids.join(',')})`
    )
  },

  async restore(db, ids) {
    return db.run(`
      UPDATE notes
        SET deleted = NULL
        WHERE note_id IN (${ids.join(',')})`
    )
  },

  async prune(db) {
    return db.run(`
      DELETE FROM notes WHERE deleted IS NOT NULL`
    )
  }
}
