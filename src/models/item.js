'use strict'

module.exports = {

  async all(db, { trash }) {
    return (await db.all(`
      WITH
        titles(id, value) AS (
          SELECT id, value AS title
          FROM metadata JOIN metadata_values USING (value_id)
          WHERE property = 'title'
        )
        SELECT id, t.value
          FROM items
            LEFT OUTER JOIN titles t USING (id)
            LEFT OUTER JOIN trash USING (id)
          WHERE deleted_at ${trash ? 'NOT' : 'IS'} NULL
          ORDER BY t.value ASC, id ASC`
    )).map(item => item.id)
  },

  async load(db, ids) {
    const items = {}

    if (ids.length) {
      await db.each(`
        SELECT s.id, created_at AS created,
            updated_at AS modified, deleted_at AS deleted,
            group_concat(photos.item_id) AS photos
          FROM subjects s
            JOIN items USING (id)
            LEFT OUTER JOIN trash USING (id)
            LEFT OUTER JOIN photos ON s.id = photos.item_id
          WHERE s.id IN (${ids.join(',')})
          GROUP BY s.id`,

        (item) => {
          items[item.id] = {
            ...item,
            photos: item.photos ? item.photos.split(',').map(Number) : []
          }
        }
      )
    }

    return items
  },

  async create(db) {
    const { id } = await db.run(`
      INSERT INTO subjects DEFAULT VALUES`)
    await db.run(`
      INSERT INTO items (id) VALUES (?)`, id)

    return (await module.exports.load(db, [id]))[id]
  },

  async delete(db, id) {
    return db.run(
      'INSERT INTO trash (id) VALUES (?)', id
    )
  },

  async destroy(db, id) {
    return db.run(
      'DElETE FROM subjects WHERE id = ?', id
    )
  },

  async restore(db, id) {
    await db.run(
      'DELETE FROM trash WHERE id = ?', id
    )
    return { id }
  },

  async prune(db) {
    return db.run(`
      DELETE FROM subjects
        WHERE id IN (
          SELECT id
          FROM trash JOIN items USING (id)
          WHERE deleted_at < datetime("now", "-1 month"))`
    )
  }
}
