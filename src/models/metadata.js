'use strict'

const { save } = require('./value')
const { into, map } = require('transducers.js')
const { keys } = Object
const { quote } = require('../common/util')
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
  },

  async replace(db, { id, data }) {
    await db.run(`
      DELETE FROM metadata
        WHERE id = ? AND property NOT IN (${
          keys(data).map(prop => quote(prop)).join(',')
        })`, id)

    return mod.metadata.update(db, { id, data })
  }

}
