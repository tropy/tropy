'use strict'

const { TEMPLATE } = require('../constants/photo')
const { all } = require('bluebird')
const metadata = require('./metadata')

module.exports = {

  async create(db, { item, image, template }, property) {
    const { path, checksum, mimetype, title } = image

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

    if (property) {
      await metadata.update(db, {
        id,
        data: {
          [property]: { value: title, type: 'text' }
        }
      })
    }

    const photo = (await module.exports.load(db, [id]))[id]
    return photo
  },

  async load(db, ids) {
    const photos = {}

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
  },

  async delete(db, ids) {
    return db.run(`
      UPDATE photos SET item_id = NULL WHERE id IN (${ids.join(',')})`
    )
  },

  async restore(db, { item, ids }) {
    return db.run(`
      UPDATE photos SET item_id = ? WHERE id IN (${ids.join(',')})`, item
    )
  },

  async prune(db) {
    return db.run(`
      DELETE FROM subjects
        WHERE id IN (
          SELECT id FROM photos WHERE item_id IS NULL
        )`
    )
  }
}
