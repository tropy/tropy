'use strict'

const { list } = require('../common/util')
const { TEMPLATE } = require('../constants/selection')

const selection = {
  async create(db, template, { photo, x, y, width, height, angle, mirror }) {
    const { id } = await db.run(`
      INSERT INTO subjects (template) VALUES (?)`, template || TEMPLATE)

    await db.run(`
      INSERT INTO images (id, width, height, angle, mirror)
        VALUES (?,?,?,?,?)`, [id, width, height, angle, mirror])

    await db.run(`
      INSERT INTO selections (id, photo_id, x, y)
        VALUES (?,?,?,?)`, [id, photo, x, y])

    return (await selection.load(db, [id]))[id]
  },

  async load(db, ids) {
    const selections = {}

    await db.each(`
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
        WHERE id IN (${list(ids)})`, (data) => {
      selections[data.id] = {
        ...data, mirror: !!data.mirror, notes: []
      }
    })

    return selections
  }
}

module.exports = selection
