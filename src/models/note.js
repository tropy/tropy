import assert from 'assert'
import { json, stringify } from '../common/util'
import { into, update } from '../common/query'
import { warn } from '../common/log'

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
        datetime(modified, "localtime") AS modified,
        datetime(created, "localtime") AS created
      FROM notes
        LEFT OUTER JOIN photos USING (id)
        LEFT OUTER JOIN selections USING (id)
      WHERE ${conditions.join(' AND ')}
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
      } catch (e) {
        warn({ stack: e.stack }, `failed parsing note ${id}`)
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

  async save(db, { id, state, text, modified = new Date }) {
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

  delete(db, id) {
    return db.run(
      ...update('notes')
        .set('deleted = datetime("now")')
        .where({ note_id: id }))
  },

  async restore(db, id) {
    await db.run(
      ...update('notes')
        .set({ deleted: null })
        .where({ note_id: id }))

    return load(db, id)
  },

  prune(db) {
    return db.run(`
      DELETE FROM notes WHERE deleted IS NOT NULL`
    )
  }
}
