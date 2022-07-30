import { array, blank, list, quote } from '../common/util.js'
import { touch } from './subject.js'
import { save } from './value.js'

async function insert(db, { id, property, value, language = 'NULL' }) {
  return db.run(`
    INSERT INTO metadata (id, property, value_id, language)
      VALUES ${
        array(id).map(x =>
          `(${[x, quote(property), value, language].join(',')})`
        ).join(', ')
      }`)
}

async function update(db, { id, data, timestamp }, replace = false) {
  let properties = Object.keys(data)
      .filter(p => (p !== 'id' && p !== 'pending'))

  await remove(db, {
    id,
    property: replace ? null : properties })

  for (let property of properties) {
    let value = data[property]

    if (typeof value === 'string')
      value = { text: value }
    if (value == null || blank(value.text))
      continue

    value = await save(db, value)
    await insert(db, { id, property, value })
  }

  if (timestamp != null) {
    await touch(db, { id, timestamp })
  }
}

async function remove(db, { id, property }) {
  return db.run(`
    DELETE FROM metadata WHERE id IN (${list(array(id))})${
      (property == null) ?
        '' : ` AND property IN (${list(array(property), quote)})`
    }`)
}

export default {
  insert,
  remove,
  update,

  async load(db, ids) {
    let data = {}

    await db.each(`
      SELECT id, property, text, datatype AS type
        FROM subjects
          JOIN metadata USING (id)
          JOIN metadata_values USING (value_id)${
        (ids != null) ? ` WHERE id IN (${list(ids)}) ` : ''
      } ORDER BY id, metadata.created ASC`,
      ({ id, property, type, text }) => {
        if (id in data) data[id][property] = { type, text }
        else data[id] = { id, [property]: { type, text } }
      }
    )

    return data
  },

  async replace(db, data) {
    return update(db, data, true)
  },

  async copy(db, { source, target }) {
    return db.run(`
      INSERT INTO metadata (id, property, value_id, language)
        SELECT ${Number(target)} AS id, property, value_id, language
          FROM metadata
          WHERE id = ?`, source)
  }
}
