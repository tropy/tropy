'use strict'

const { save } = require('./value')
const { keys } = Object
const { array, blank, get, list, quote } = require('../common/util')
const { touch } = require('./subject')

const metadata = {
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

  async remove(db, { id, property }) {
    return db.run(`
      DELETE FROM metadata WHERE id IN (${list(array(id))})${
        (property == null) ?
          '' : ` AND property IN (${list(array(property), quote)})`
      }`)
  },

  async insert(db, { id, property, value, language = 'NULL' }) {
    return db.run(`
      INSERT INTO metadata (id, property, value_id, language)
        VALUES ${
          array(id).map(x =>
            `(${[x, quote(property), value, language].join(',')})`
          ).join(', ')
        }`)
  },

  async update(db, { id, data, timestamp }, replace = false) {
    let properties = keys(data).filter(p => (p !== 'id' && p !== 'pending'))

    await metadata.remove(db, {
      id,
      property: replace ? null : properties })

    for (let property of properties) {
      if (blank(get(data, [property, 'text']))) continue

      let value = await save(db, data[property])
      await metadata.insert(db, { id, property, value })
    }

    if (timestamp != null) {
      await touch(db, { id, timestamp })
    }
  },

  async replace(db, data) {
    return metadata.update(db, data, true)
  },

  async copy(db, { source, target }) {
    return db.run(`
      INSERT INTO metadata (id, property, value_id, language)
        SELECT ${Number(target)} AS id, property, value_id, language
          FROM metadata
          WHERE id = ?`, source)
  }
}

module.exports = metadata
