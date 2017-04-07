'use strict'

const { json, stringify } = require('../common/util')

module.exports = {

  async create(db, { state, text, photo }) {
    const { id } = await db.run(`
      INSERT INTO notes (id, state, text) VALUES (?,?,?)`,
      photo, stringify(state), text
    )

    return (await module.exports.load(db, [id]))[id]
  },

  async load(db, ids) {
    const notes = {}

    if (ids.length) {
      await db.each(`
        SELECT note_id AS note, photos.id AS photo,
            state, text, language, modified
          FROM notes
            LEFT OUTER JOIN photos USING (id)
          WHERE note_id IN (${ids.join(',')})
            AND deleted IS NULL
          ORDER BY created ASC`,

        ({ note, state, ...data }) => {
          notes[note] = {
            ...data, id: note, state: json(state), deleted: false
          }
        }
      )
    }

    return notes
  },

  async save(db, { id, state, text }) {
    return db.run(`
      UPDATE notes
        SET state = ?, text = ?, modified = datetime("now")
        WHERE note_id = ?`, stringify(state), text, id
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
