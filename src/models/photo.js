'use strict'

const { TEMPLATE } = require('../constants/photo')
const { all } = require('bluebird')

module.exports = {

  async create(db, { item, image, template }) {
    const { path, checksum, mimetype } = image

    const { id } = await db.run(`
      INSERT INTO subjects (template) VALUES (?)`, template || TEMPLATE)

    await all([
      db.run('INSERT INTO images (id) VALUES (?)', id),
      db.run(`
        INSERT INTO photos (id, item_id, path, checksum, mimetype)
          VALUES (?,?,?,?,?)`,
        [id, item, path, checksum, mimetype]
      )
    ])

    return (await module.exports.load(db, [id]))[id]
  },

  async load(db, ids) {
    const photos = {}

    // TODO load by photo id
    if (ids.length) {
      await db.each(`
        SELECT s.id, item_id AS item, width, height, path,
            protocol, mimetype, checksum, orientation, exif,
            created_at AS created, updated_at AS modified,
            group_concat(selections.id) AS selections
          FROM subjects s
            JOIN images USING (id)
            JOIN photos USING (id)
            LEFT OUTER JOIN selections ON s.id = selections.photo_id
          WHERE item_id IN (${ids.join(',')})
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
