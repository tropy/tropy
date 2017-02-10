'use strict'

const { save } = require('./value')
const { into, map } = require('transducers.js')

module.exports = {
  async load(db, ids) {
    const data = into({}, map(id => [id, { id }]), ids)

    if (ids.length) {
      await db.each(`
        SELECT id, property, value, type_name AS type, metadata.created
          FROM subjects
            JOIN metadata USING (id)
            JOIN metadata_values USING (value_id)
          WHERE id IN (${ids.join(',')})
          ORDER BY id, metadata.created ASC`,

        ({ id, property, type, value }) => {
          data[id][property] = { type, value }
        }
      )
    }

    return data
  },

  async update(db, { id, data }) {
    for (let property in data) {

      if (data[property] == null) continue

      const value = await save(db, data[property])

      const params = {
        $id: id, $property: property, $value: value, $language: null
      }

      // To speed this up, we could use db.exec using
      // changes() and sanitize the params ourselves.
      const { changes } = await db.run(`
        UPDATE metadata
          SET value_id = $value, language = $language
          WHERE id = $id AND property = $property`, params)

      if (!changes) {
        await db.run(`
          INSERT INTO metadata (id, property, value_id, language)
            VALUES ($id, $property, $value, $language)`, params
        )
      }
    }
  }

}
