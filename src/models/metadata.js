'use strict'

const { save } = require('./value')
const { into, map } = require('transducers.js')
const { keys } = Object
const { list, quote } = require('../common/util')
const mod = {}

module.exports = mod.metadata = {
  async load(db, ids) {
    const data = into({}, map(id => [id, { id }]), ids)

    if (ids.length) {
      await db.each(`
        SELECT id, property, text, type_name AS type, metadata.created
          FROM subjects
            JOIN metadata USING (id)
            JOIN metadata_values USING (value_id)
          WHERE id IN (${ids.join(',')})
          ORDER BY id, metadata.created ASC`,

        ({ id, property, type, text }) => {
          data[id][property] = { type, text }
        }
      )
    }

    return data
  },

  async update(db, { ids, data }, replace = false) {
    await db.run(`
      DELETE FROM metadata WHERE id IN (${list(ids)})${
        replace ? '' : ` AND property IN (${list(keys(data), quote)})`
      }`)

    for (let prop in data) {
      if (data[prop] == null) continue

      const value = await save(db, data[prop])

      await db.run(`
        INSERT INTO metadata (id, property, value_id, language)
          ${ids.map(id =>
            `VALUES (${[id, quote(prop), value, 'NULL'].join(',')})`
          ).join(' ')}`)
    }
  },

  async replace(db, data) {
    return mod.metadata.update(db, data, true)
  }

}
