import assert from 'assert'
import { json, stringify } from '../common/util'
import { into, update } from '../common/query'

async function load(db, ids) {
  let notes = {}

  let conditions = ['deleted IS NULL']
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
}

export default {
  load,

  async create(db, { state, text, id: parent }) {
    let { id } = await db.run(...into('notes').insert({
      id: parent,
      state: stringify(state),
      text
    }))

    return (await load(db, [id]))[id]
  },

  save(db, { id, state, text }, timestamp = Date.now()) {
    assert(id != null, 'missing id')
    assert(state != null, 'missing state')

    let query = update('notes')
      .set({
        state: stringify(state),
        modified: new Date(timestamp).toISOString()
      })
      .where({ note_id: id })

    if (text != null) {
      assert(text !== '', 'empty text')
      query.set({ text })
    }

    return db.run(...query)
  },

  delete(db, note_id) {
    return db.run(
      ...update('notes')
        .set('deleted = datetime("now")')
        .where({ note_id }))
  },

  restore(db, note_id) {
    return db.run(
      ...update('notes')
        .set({ deleted: null })
        .where({ note_id }))
  },

  prune(db) {
    return db.run(`
      DELETE FROM notes WHERE deleted IS NOT NULL`
    )
  }
}
