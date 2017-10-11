'use strict'

const assert = require('assert')
const { json, stringify } = require('../common/util')

const mod = {
  note: {
    async create(db, { state, text, id: parent }) {
      const { id } = await db.run(`
        INSERT INTO notes (id, state, text) VALUES (?,?,?)`,
        parent, stringify(state), text
      )

      return (await mod.note.load(db, [id]))[id]
    },

    async load(db, ids) {
      const notes = {}

      const conditions = ['deleted IS NULL']
      if (ids != null) conditions.push(`note_id IN (${ids.join(',')})`)

      await db.each(`
        SELECT
            note_id AS note,
            photos.id AS photo,
            selections.id AS selection,
            state,
            text,
            language,
            datetime(modified, "localtime") AS modified
          FROM notes
            LEFT OUTER JOIN photos USING (id)
            LEFT OUTER JOIN selections USING (id)
          WHERE ${conditions.join(' AND ')}
          ORDER BY created ASC`,

        ({ note: id, modified, state, ...data }) => {
          notes[id] = {
            ...data,
            id,
            modified: new Date(modified),
            state: json(state),
            deleted: false
          }
        }
      )

      return notes
    },

    save(db, { id, state, text }, timestamp = Date.now()) {
      assert(id != null, 'missing id')
      assert(state != null, 'missing state')

      const assigs = [
        'state = $state',
        'modified = datetime($modified)'
      ]

      if (text != null) {
        assert(text !== '', 'empty text')
        assigs.push('text = $text')
      }

      return db.run(`
        UPDATE notes
          SET ${assigs.join(', ')}
          WHERE note_id = $id`, {
            $id: id,
            $state: stringify(state),
            $text: text,
            $modified: new Date(timestamp).toISOString()
          }
      )
    },

    delete(db, ids) {
      return db.run(`
        UPDATE notes
          SET deleted = datetime("now")
          WHERE note_id IN (${ids.join(',')})`
      )
    },

    restore(db, ids) {
      return db.run(`
        UPDATE notes
          SET deleted = NULL
          WHERE note_id IN (${ids.join(',')})`
      )
    },

    prune(db) {
      return db.run(`
        DELETE FROM notes WHERE deleted IS NOT NULL`
      )
    }
  }
}

module.exports = mod.note
