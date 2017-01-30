'use strict'

const { TEMPLATE } = require('../constants/photo')
const { DC } = require('../constants/properties')
const { all } = require('bluebird')
const { text, datetime } = require('../value')
const metadata = require('./metadata')

module.exports = {

  async create(db, { item, image, template }) {
    const {
      path, checksum, mimetype, width, height, orientation
    } = image

    const { id } = await db.run(`
      INSERT INTO subjects (template) VALUES (?)`, template || TEMPLATE)

    await all([
      db.run(`
        INSERT INTO images (id, width, height)
          VALUES (?,?,?)`, [id, width, height]),
      db.run(`
        INSERT INTO photos (id, item_id, path, checksum, mimetype, orientation)
          VALUES (?,?,?,?,?,?)`,
        [id, item, path, checksum, mimetype, orientation]),

      metadata.update(db, {
        id,
        data: {
          [DC.TITLE]: text(image.title),
          [DC.DATE]: datetime(image.date)
        }
      })
    ])


    return (await module.exports.load(db, [id]))[id]
  },

  async load(db, ids) {
    const photos = {}

    if (ids.length) {
      await db.each(`
        SELECT s.id, item_id AS item, created, modified,
            width, height, path, protocol, mimetype,
            checksum, orientation, exif,
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

  async move(db, { ids, item }) {
    return db.run(`
      UPDATE photos SET item_id = ?  WHERE id in (${ids.join(',')})`,
      item)
  },

  async delete(db, ids) {
    return db.run(`
      INSERT INTO trash (id)
        VALUES ${ids.map(id => `(${id})`).join(',')}`
    )
  },

  async restore(db, { ids }) {
    return db.run(`
      DELETE FROM trash WHERE id IN (${ids.join(',')})`
    )
  },

  async prune(db) {
    return db.run(`
      DELETE FROM subjects
        WHERE id IN (
          SELECT id FROM trash JOIN photos USING (id)
        )`
    )
  }
}
