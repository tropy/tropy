'use strict'

const { save } = require('./value')
const { into, map } = require('transducers.js')

module.exports = {
  async load(db, ids) {
    const data = into({}, map(id => [id, {}]), ids)

    if (ids.length) {
      await db.each(`
        SELECT id, property, value, type_name AS type, created_at
          FROM items
            JOIN metadata USING (id)
            JOIN metadata_values USING (value_id)
          WHERE id IN (${ids.join(',')})
          ORDER BY id, created_at ASC`,

        ({ id, property, type, value }) => {
          data[id][property] = { type, value }
        }
      )
    }

    return data
  },

  async update(db, { id, property, value }) {
    const v = await save(db, value)

    return await db.run(`
      REPLACE INTO metadata (id, property, value_id)
        VALUES (?, ?, ?)`, id, property, v.id)
  },

}
