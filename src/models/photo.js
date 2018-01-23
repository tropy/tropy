'use strict'

const assert = require('assert')
const { TEMPLATE } = require('../constants/photo')
const { DC } = require('../constants')
const { all } = require('bluebird')
const { text, date } = require('../value')
const metadata = require('./metadata')
const bb = require('bluebird')
const { assign } = Object
const subject = require('./subject')
const { blank } = require('../common/util')

const COLUMNS = [
  'checksum',
  'mimetype',
  'orientation',
  'path',
  'size'
]

const VALUES = {
  consolidated: (column) => (`datetime($${column})`),
  default: (column) => `$${column}`
}

const filter = (column) =>
  (VALUES[column] || VALUES.default)(column)

const skel = (id, selections = [], notes = []) => ({
  id, selections, notes
})


module.exports = {
  async create(db, template, { item, image, data, position }) {
    const {
      path, checksum, mimetype, width, height, orientation, size
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
            orientation,
            position
          ) VALUES (?,?,?,?,?,?,?,?)`,
        [id, item, path, size, checksum, mimetype, orientation, position]),

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

  async save(db, { id, timestamp, ...data }) {
    const assignments = []
    const params = { $id: id }

    for (let column of COLUMNS) {
      if (column in data) {
        assignments.push(`${column} = ${filter(column)}`)
        params[`$${column}`] = data[column]
      }
    }

    assert(id != null, 'missing photo id')
    if (assignments.length === 0) return

    await db.run(`
      UPDATE photos
        SET ${assignments.join(', ')}
        WHERE id = $id`, params)

    if (timestamp != null) {
      await subject.touch(db, { id, timestamp })
    }
  },

  async load(db, ids) {
    const photos = {}
    if (ids != null) ids = ids.join(',')

    await all([
      db.each(`
        SELECT
            id,
            item_id AS item,
            template,
            datetime(created, "localtime") AS created,
            datetime(modified, "localtime") AS modified,
            angle,
            mirror,
            brightness,
            contrast,
            hue,
            saturation,
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
            JOIN photos USING (id)${
          ids != null ? ` WHERE id IN (${ids})` : ''
        }`,
        ({ id, created, modified, mirror, ...data }) => {
          data.created = new Date(created)
          data.modified = new Date(modified)
          data.mirror = !!mirror

          if (id in photos) assign(photos[id], data)
          else photos[id] = assign(skel(id), data)
        }
      ),

      db.each(`
        SELECT id AS selection, photo_id AS id
          FROM selections
            LEFT OUTER JOIN trash USING (id)
          WHERE ${ids != null ? `photo_id IN (${ids}) AND` : ''}
            deleted IS NULL
          ORDER BY photo_id, position`,
        ({ selection, id }) => {
          if (id in photos) photos[id].selections.push(selection)
          else photos[id] = skel(id, [selection])
        }
      ),

      db.each(`
        SELECT id, note_id AS note
          FROM notes
          WHERE ${ids != null ? `id IN (${ids}) AND` : ''} deleted IS NULL
          ORDER BY id, created`,
        ({ id, note }) => {
          if (id in photos) photos[id].notes.push(note)
          else photos[id] = skel(id, [], [note])
        }
      )
    ])

    return photos
  },

  find(db, { checksum }) {
    return db.get(`
      SELECT p.id, item_id AS item
        FROM photos p
          LEFT OUTER JOIN trash tp USING (id)
          LEFT OUTER JOIN trash ti ON (ti.id = item_id)
        WHERE checksum = ?
          AND tp.deleted IS NULL
          AND ti.deleted IS NULL`, checksum)
  },

  async move(db, { ids, item }) {
    return db.run(`
      UPDATE photos SET item_id = ?  WHERE id in (${ids.join(',')})`,
      item)
  },

  async order(db, item, photos, offset = 0) {
    if (!blank(photos)) {
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
    if (!blank(photos)) {
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
        VALUES ${ids.map(id => `(${id})`).join(',')}`)
  },

  async restore(db, { ids }) {
    return db.run(`
      DELETE FROM trash WHERE id IN (${ids.join(',')})`)
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
