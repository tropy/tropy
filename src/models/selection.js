'use strict'

const { list } = require('../common/util')
const { TEMPLATE } = require('../constants/selection')
const { all } = require('bluebird')
const { into, map } = require('transducers.js')


const mod = {
  selection: {
    async create(db, template, { photo, x, y, width, height, angle, mirror }) {
      const { id } = await db.run(`
        INSERT INTO subjects (template) VALUES (?)`, template || TEMPLATE)

      await db.run(`
        INSERT INTO images (id, width, height, angle, mirror)
          VALUES (?,?,?,?,?)`, [id, width, height, angle, mirror])

      await db.run(`
        INSERT INTO selections (id, photo_id, x, y)
          VALUES (?,?,?,?)`, [id, photo, x, y])

      return (await mod.selection.load(db, [id]))[id]
    },

    async load(db, ...ids) {
      const selections = into({}, map(id => [id, { id, notes: [] }]), ids)

      ids = list(ids)

      await all([
        db.each(`
          SELECT
              id,
              photo_id AS photo,
              x,
              y,
              width,
              height,
              angle,
              mirror,
              template,
              datetime(created, "localtime") AS created,
              datetime(modified, "localtime") AS modified
            FROM subjects
              JOIN images USING (id)
              JOIN selections USING (id)
            WHERE id IN (${ids})`,
        (data) => {
          Object.assign(selections[data.id], data, {
            created: new Date(data.created),
            modified: new Date(data.modified),
            mirror: !!data.mirror
          })
        }),

        db.each(`
          SELECT id, note_id AS note
            FROM notes
            WHERE id IN (${ids}) AND deleted IS NULL
            ORDER BY id, created`,
          ({ id, note }) => {
            selections[id].notes.push(note)
          }
        )
      ])

      return selections
    },

    async order(db, photo, selections, offset = 0) {
      if (selections.length) {
        return db.run(`
          UPDATE selections
            SET position = CASE id
              ${selections.map((_, idx) =>
                (`WHEN ? THEN ${offset + idx + 1}`)).join(' ')}
              END
            WHERE photo_id = ?`,
          ...selections, photo)
      }
    },

    async delete(db, ...ids) {
      return db.run(`
        INSERT INTO trash (id)
          VALUES ${ids.map(id => `(${id})`).join(',')}`)
    },

    async restore(db, ...ids) {
      return db.run(`
        DELETE FROM trash WHERE id IN (${list(ids)})`
      )
    },

    async prune(db) {
      return db.run(`
        DELETE FROM subjects
          WHERE id IN (
            SELECT id FROM trash JOIN selections USING (id)
          )`
      )
    }
  }
}

module.exports = mod.selection
