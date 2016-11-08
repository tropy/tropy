'use strict'

const { TEMPLATE } = require('../constants/photo')
const { all } = require('bluebird')

module.exports = {

  async create(db, { item, path, template }) {
    const { id } = await db.run(`
      INSERT INTO subjects (template) VALUES (?)`, template || TEMPLATE)

    await all([
      db.run('INSERT INTO images (id) VALUES (?)', id),
      db.run(`
        INSERT INTO photos (id, item_id, path) VALUES (?,?,?)`, [
          id, item, path
        ])
    ])

    return (await module.exports.load(db, [id]))[id]
  },

  async load(db, ids) {
    const photos = {}

    if (ids.length) {
      await db.each(`
        SELECT id, created_at AS created,
            updated_at AS modified, deleted_at AS deleted,
            group_concat(selections.id) AS selections
          FROM subjects s
            JOIN images USING (id)
            LEFT OUTER JOIN trash USING (id)
            LEFT OUTER JOIN selections ON s.id = selections.photo_id
          WHERE s.id IN (${ids.join(',')})
          GROUP BY s.id`,

        (photo) => {
          photos[photo.id] = {
            ...photo,
            selections: photo.selections ?
              photo.selections.split(',').map(Number) : []
          }
        }
      )
    }

    return photos
  }
}
