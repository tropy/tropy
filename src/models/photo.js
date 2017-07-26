'use strict'

const { TEMPLATE } = require('../constants/photo')
const { DC } = require('../constants')
const { all } = require('bluebird')
const { text, date } = require('../value')
const metadata = require('./metadata')
const { into, map } = require('transducers.js')
const { assign } = Object
const bb = require('bluebird')

const skel = (id) => ({
  id, selections: [], notes: []
})

module.exports = {

  async create(db, template, { item, image, data }) {
    const {
      path, checksum, mimetype, width, height, orientation, file
    } = image

    const { id } = await db.run(`
      INSERT INTO subjects (template) VALUES (?)`, template || TEMPLATE)

    await db.run(`
      INSERT INTO images (id, width, height) VALUES (?,?,?)`,
      [id, width, height])

    await all([
      db.run(`
        INSERT INTO photos (
            id,
            item_id,
            path,
            size,
            checksum,
            mimetype,
            orientation
          ) VALUES (?,?,?,?,?,?,?)`,
        [id, item, path, file.size, checksum, mimetype, orientation]),

      metadata.update(db, {
        ids: [id],
        data: {
          [DC.title]: text(image.title),
          [DC.date]: date(image.date),
          ...data
        }
      })
    ])

    return (await module.exports.load(db, [id]))[id]
  },

  async load(db, ids) {
    const photos = into({}, map(id => [id, skel(id)]), ids)

    if (ids.length) {
      ids = ids.join(',')

      await all([
        db.each(`
          SELECT
              id,
              item_id AS item,
              template,
              datetime(created, "localtime") AS created,
              datetime(modified, "localtime") AS modified,
              width,
              height,
              path,
              size,
              protocol,
              mimetype,
              checksum,
              orientation
            FROM subjects
              JOIN images USING (id)
              JOIN photos USING (id)
            WHERE id IN (${ids})`,

          (data) => {
            assign(photos[data.id], data, {
              created: new Date(data.created),
              modified: new Date(data.modified),
            })
          }
        ),

        //db.each(`
        //  SELECT id, photo_id AS photo
        //    FROM selections
        //      LEFT OUTER JOIN trash USING (id)
        //    WHERE photo_id IN (${ids})
        //      AND deleted IS NULL
        //    ORDER BY photo_id, position`,
        //  ({ id, photo }) => {
        //    photos[photo].selections.push(id)
        //  }
        //),

        db.each(`
          SELECT id, note_id AS note
            FROM notes
            WHERE id IN (${ids}) AND deleted IS NULL
            ORDER BY id, created`,
          ({ id, note }) => {
            photos[id].notes.push(note)
          }
        )
      ])
    }

    return photos
  },

  find(db, { checksum }) {
    return db.get(`
      SELECT id, item_id AS item
        FROM photos
        WHERE checksum = ?`, checksum)
  },

  async move(db, { ids, item }) {
    return db.run(`
      UPDATE photos SET item_id = ?  WHERE id in (${ids.join(',')})`,
      item)
  },

  async order(db, item, photos, offset = 0) {
    if (photos.length) {
      return db.run(`
        UPDATE photos
          SET position = CASE id
            ${photos.map((_, idx) =>
              (`WHEN ? THEN ${offset + idx + 1}`)).join(' ')}
            END
          WHERE item_id = ?`,
        ...photos, item)
    }
  },

  async merge(db, item, photos, offset = 0) {
    if (photos.length) {
      return db.run(`
        UPDATE photos
          SET item_id = ?, position = CASE id
            ${photos.map((_, idx) =>
              (`WHEN ? THEN ${offset + idx + 1}`)).join(' ')}
            END
          WHERE id IN (${photos.join(',')})`,
        item, ...photos)
    }
  },

  async split(db, item, items, concurrency = 4) {
    return bb.map(items, ({ id, photos }) =>
      db.run(`
        UPDATE photos
          SET item_id = ?, position = CASE id
            ${photos.map((_, idx) =>
              (`WHEN ? THEN ${idx + 1}`)).join(' ')}
            END
          WHERE id IN (${photos.join(',')})`,
        id, ...photos), { concurrency })
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
