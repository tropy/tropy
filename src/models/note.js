import assert from 'node:assert'
import { json, stringify } from '../common/util.js'
import { into, update } from '../common/query.js'
import sql, { IN } from '../common/sql.js'
import { warn } from '../common/log.js'

async function load (db, ids) {
  let notes = {}

  await db.each(sql`
    SELECT
        note_id AS note,
        photos.id AS photo,
        selections.id AS selection,
        state,
        text,
        language,
        datetime(modified, 'localtime') AS modified,
        datetime(created, 'localtime') AS created
      FROM notes
        LEFT OUTER JOIN photos USING (id)
        LEFT OUTER JOIN selections USING (id)
      WHERE deleted IS NULL${
        (ids != null) ? sql` AND note_id ${IN(ids)}` : sql``
      }
      ORDER BY created ASC`,

  ({ note: id, created, modified, state, ...data }) => {
    try {
      notes[id] = {
        ...data,
        id,
        modified: new Date(modified),
        created: new Date(created),
        state: json(state),
        deleted: false
      }
    } catch (err) {
      warn({ err, note: id }, 'failed parsing note')
    }
  }
  )

  return notes
}

export default {
  load,

  async create (db, { state, text, id: parent }) {
    let { id } = await db.run(...into('notes').insert({
      id: parent,
      state: stringify(state),
      text
    }))

    return (await load(db, [id]))[id]
  },

  async copy (db, { source, target }) {
    let copies = await db.all(`
      INSERT INTO notes (id, text, state, language, created, modified)
        SELECT ?, text, state, language, created, modified
          FROM notes
          WHERE id = ? AND deleted IS NULL
        RETURNING note_id`, target, source)

    return (copies.length)
      ? Object.values(await load(db, copies.map(n => n.note_id)))
      : []
  },

  async save (db, { id, state, text, modified = new Date }) {
    assert(id != null, 'missing id')
    assert(state != null, 'missing state')

    let query = update('notes')
      .set({
        state: stringify(state),
        modified: modified.toISOString()
      })
      .where({ note_id: id })

    if (text != null) {
      assert(text !== '', 'empty text')
      query.set({ text })
    }

    await db.run(...query)
  },

  async delete (db, id) {
    let deleted = await db.all(
      ...update('notes')
        .set("deleted = datetime('now')")
        .where({ note_id: id })
        .returning('note_id'))
    return deleted.map(n => n.note_id)
  },

  async restore (db, id) {
    await db.run(
      ...update('notes')
        .set({ deleted: null })
        .where({ note_id: id }))

    return load(db, id)
  },

  prune (db) {
    return db.run(`
      DELETE FROM notes WHERE deleted IS NOT NULL`
    )
  }
}
