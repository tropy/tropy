import { array, blank } from '../common/util.js'
import sql, { IN } from '../common/sql.js'
import { touch } from './subject.js'
import { save } from './value.js'

async function insert (db, { id, property, value, language = null }) {
  return db.run(sql`
    INSERT INTO metadata (id, property, value_id, language)
      SELECT value, ${property}, ${value}, ${language}
        FROM json_each(${array(id)})`)
}

async function update (db, { id, data, timestamp }, replace = false) {
  let properties = Object.keys(data)
    .filter(p => (p !== 'id' && p !== 'pending'))

  await remove(db, {
    id,
    property: replace ? null : properties })

  for (let property of properties) {
    let value = data[property]

    if (value == null || blank(value.text))
      continue

    value = await save(db, value)
    await insert(db, { id, property, value })
  }

  if (timestamp != null) {
    await touch(db, { id, timestamp })
  }
}

async function remove (db, { id, property }) {
  return db.run(sql`
    DELETE FROM metadata
      WHERE id ${IN(array(id))}${
        (property == null) ?
          sql`` : sql` AND property ${IN(array(property))}`
      }`)
}

export default {
  insert,
  remove,
  update,

  async load (db, ids) {
    let data = {}

    await db.each(sql`
      SELECT id, property, text, datatype AS type
        FROM subjects
          JOIN metadata USING (id)
          JOIN metadata_values USING (value_id)${
            (ids != null) ? sql` WHERE id ${IN(ids)}` : sql``
          } ORDER BY id, metadata.created ASC`,
    ({ id, property, type, text }) => {
      if (id in data) data[id][property] = { type, text }
      else data[id] = { id, [property]: { type, text } }
    }
    )

    return data
  },

  async replace (db, data) {
    return update(db, data, true)
  },

  async copy (db, { source, target }) {
    return db.run(`
      INSERT INTO metadata (id, property, value_id, language)
        SELECT ? AS id, property, value_id, language
          FROM metadata
          WHERE id = ?`, [target, source])
  }
}
